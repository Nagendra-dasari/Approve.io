import { useEffect, useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";
import useAuth from "../../../hooks/useAuth";

function WorkflowsPage() {
  const { showToast } = useToast();
  const { tenantContextId } = useAuth();
  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState([]);
  const [forms, setForms] = useState([]);
  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    positionId: "",
    onTimeoutEscalateToPositionId: "",
  });
  const [submissionForm, setSubmissionForm] = useState({
    workflowId: "",
    formId: "",
    dataJson: "{}",
  });
  const [submissionLookupId, setSubmissionLookupId] = useState("");
  const [submissionDetails, setSubmissionDetails] = useState(null);

  const load = async () => {
    try {
      const [workflowRes, positionRes, formRes] = await Promise.all([
        api.get("/workflows"),
        api.get("/positions"),
        api.get("/forms"),
      ]);
      setItems(workflowRes.data || []);
      setPositions(positionRes.data || []);
      setForms(formRes.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/workflows"), api.get("/positions"), api.get("/forms")])
      .then(([workflowRes, positionRes, formRes]) => {
        if (!active) return;
        setItems(workflowRes.data || []);
        setPositions(positionRes.data || []);
        setForms(formRes.data || []);
      })
      .catch((error) => showToast(getErrorMessage(error), "error"));
    return () => {
      active = false;
    };
  }, [showToast, tenantContextId]);

  useEffect(() => {
    setWorkflowForm({ name: "", positionId: "", onTimeoutEscalateToPositionId: "" });
    setSubmissionForm({ workflowId: "", formId: "", dataJson: "{}" });
    setSubmissionLookupId("");
    setSubmissionDetails(null);
  }, [tenantContextId]);

  const createWorkflow = async (event) => {
    event.preventDefault();
    try {
      const steps = [
        {
          order: 1,
          positionId: workflowForm.positionId,
          onTimeoutEscalateToPositionId: workflowForm.onTimeoutEscalateToPositionId || null,
        },
      ];
      await api.post("/workflows", {
        name: workflowForm.name,
        steps,
      });
      setWorkflowForm({ name: "", positionId: "", onTimeoutEscalateToPositionId: "" });
      showToast("Workflow created", "success");
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const createSubmission = async (event) => {
    event.preventDefault();
    try {
      const res = await api.post("/workflows/submissions", {
        workflowId: submissionForm.workflowId,
        formId: submissionForm.formId,
        data: JSON.parse(submissionForm.dataJson),
      });
      showToast(`Submission created: ${res.data._id}`, "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const fetchSubmission = async () => {
    if (!submissionLookupId) {
      showToast("Enter submission ID to fetch details", "info");
      return;
    }
    try {
      const res = await api.get(`/workflows/submissions/${submissionLookupId}`);
      setSubmissionDetails(res.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Workflows" description="Create workflow definitions, create submissions, and inspect approval trails.">
      <TenantScopeBanner context="Workflows" />
      <h3>1) Create Workflow</h3>
      <form className="inline-form" onSubmit={createWorkflow}>
        <input
          placeholder="Workflow name"
          value={workflowForm.name}
          onChange={(e) => setWorkflowForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <select
          value={workflowForm.positionId}
          onChange={(e) => setWorkflowForm((p) => ({ ...p, positionId: e.target.value }))}
          required
        >
          <option value="">Approver position</option>
          {positions.map((position) => (
            <option key={position._id} value={position._id}>
              {position.title} ({position._id})
            </option>
          ))}
        </select>
        <select
          value={workflowForm.onTimeoutEscalateToPositionId}
          onChange={(e) =>
            setWorkflowForm((p) => ({ ...p, onTimeoutEscalateToPositionId: e.target.value }))
          }
        >
          <option value="">Escalate to (optional)</option>
          {positions.map((position) => (
            <option key={position._id} value={position._id}>
              {position.title} ({position._id})
            </option>
          ))}
        </select>
        <button className="btn-primary" type="submit">
          Create Workflow
        </button>
      </form>
      <DataTable columns={[{ key: "_id", label: "ID" }, { key: "name", label: "Name" }, { key: "status", label: "Status" }]} rows={items} />

      <h3>2) Create Submission</h3>
      <form className="inline-form" onSubmit={createSubmission}>
        <select
          value={submissionForm.workflowId}
          onChange={(e) => setSubmissionForm((p) => ({ ...p, workflowId: e.target.value }))}
          required
        >
          <option value="">Select workflow</option>
          {items.map((workflow) => (
            <option key={workflow._id} value={workflow._id}>
              {workflow.name} ({workflow._id})
            </option>
          ))}
        </select>
        <select
          value={submissionForm.formId}
          onChange={(e) => setSubmissionForm((p) => ({ ...p, formId: e.target.value }))}
          required
        >
          <option value="">Select form</option>
          {forms.map((form) => (
            <option key={form._id} value={form._id}>
              {form.title} ({form._id})
            </option>
          ))}
        </select>
        <input
          placeholder='Data JSON {"k":"v"}'
          value={submissionForm.dataJson}
          onChange={(e) => setSubmissionForm((p) => ({ ...p, dataJson: e.target.value }))}
          required
        />
        <button className="btn-primary" type="submit">
          Submit
        </button>
      </form>

      <h3>3) Inspect Submission</h3>
      <div className="inline-form">
        <input
          placeholder="Submission ID for lookup"
          value={submissionLookupId}
          onChange={(e) => setSubmissionLookupId(e.target.value)}
        />
        <button className="btn-secondary" type="button" onClick={fetchSubmission}>
          Get Submission Details
        </button>
      </div>
      {submissionDetails ? <pre className="json-block">{JSON.stringify(submissionDetails, null, 2)}</pre> : null}
    </ModulePage>
  );
}

export default WorkflowsPage;
