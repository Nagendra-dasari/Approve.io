import { useEffect, useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";
import useAuth from "../../../hooks/useAuth";

function FormsPage() {
  const { showToast } = useToast();
  const { tenantContextId } = useAuth();
  const [items, setItems] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [form, setForm] = useState({ title: "", workflowId: "", schemaJson: "{}" });

  const load = async () => {
    try {
      const [formsRes, workflowRes] = await Promise.all([api.get("/forms"), api.get("/workflows")]);
      setItems(formsRes.data || []);
      setWorkflows(workflowRes.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/forms"), api.get("/workflows")])
      .then(([formsRes, workflowRes]) => {
        if (!active) return;
        setItems(formsRes.data || []);
        setWorkflows(workflowRes.data || []);
      })
      .catch((error) => showToast(getErrorMessage(error), "error"));
    return () => {
      active = false;
    };
  }, [showToast, tenantContextId]);

  useEffect(() => {
    setForm({ title: "", workflowId: "", schemaJson: "{}" });
  }, [tenantContextId]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await api.post("/forms", {
        title: form.title,
        workflowId: form.workflowId,
        schema: JSON.parse(form.schemaJson),
      });
      setForm({ title: "", workflowId: "", schemaJson: "{}" });
      showToast("Form created", "success");
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const publish = async (formId) => {
    try {
      await api.post(`/forms/${formId}/publish`);
      showToast("Form published", "success");
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Forms" description="Create and publish forms linked to workflows.">
      <TenantScopeBanner context="Forms" />
      <h3>1) Create Form</h3>
      <form className="inline-form" onSubmit={create}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
        <select
          value={form.workflowId}
          onChange={(e) => setForm((p) => ({ ...p, workflowId: e.target.value }))}
          required
        >
          <option value="">Select workflow</option>
          {workflows.map((workflow) => (
            <option key={workflow._id} value={workflow._id}>
              {workflow.name} ({workflow._id})
            </option>
          ))}
        </select>
        <input
          placeholder='Schema JSON {"fields":[]}'
          value={form.schemaJson}
          onChange={(e) => setForm((p) => ({ ...p, schemaJson: e.target.value }))}
          required
        />
        <button className="btn-primary" type="submit">
          Create Form
        </button>
      </form>
      <h3>2) Publish Form</h3>
      <DataTable
        columns={[
          { key: "_id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <button className="btn-secondary" type="button" onClick={() => publish(row._id)}>
                Publish
              </button>
            ),
          },
        ]}
        rows={items}
      />
    </ModulePage>
  );
}

export default FormsPage;
