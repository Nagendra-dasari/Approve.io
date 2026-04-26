import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { getErrorMessage } from "../../../lib/error";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import { useToast } from "../../../components/common/ToastProvider";

function TenantsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", plan: "starter", status: "ACTIVE" });

  const load = async () => {
    try {
      const res = await api.get("/tenants");
      setItems(res.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get("/tenants")
      .then((res) => {
        if (active) setItems(res.data || []);
      })
      .catch((error) => showToast(getErrorMessage(error), "error"));
    return () => {
      active = false;
    };
  }, [showToast]);

  const createTenant = async (event) => {
    event.preventDefault();
    try {
      await api.post("/tenants", form);
      showToast("Tenant created", "success");
      setForm({ name: "", code: "", plan: "starter", status: "ACTIVE" });
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      const status = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await api.patch(`/tenants/${tenant._id}`, { status });
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Tenants" description="Create and manage tenant lifecycle.">
      <form className="inline-form" onSubmit={createTenant}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input placeholder="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
        <input placeholder="Plan" value={form.plan} onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))} />
        <button className="btn-primary" type="submit">
          Create
        </button>
      </form>
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "code", label: "Code" },
          { key: "plan", label: "Plan" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <button className="btn-secondary" type="button" onClick={() => toggleStatus(row)}>
                Toggle Status
              </button>
            ),
          },
        ]}
        rows={items}
      />
    </ModulePage>
  );
}

export default TenantsPage;
