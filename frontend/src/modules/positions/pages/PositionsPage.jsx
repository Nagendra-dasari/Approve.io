import { useEffect, useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";
import useAuth from "../../../hooks/useAuth";

function PositionsPage() {
  const { showToast } = useToast();
  const { tenantContextId } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", levelName: "", parentPositionId: "" });
  const [subtree, setSubtree] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/positions");
      setItems(res.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    let active = true;
    setSubtree([]);
    api
      .get("/positions")
      .then((res) => {
        if (active) setItems(res.data || []);
      })
      .catch((error) => showToast(getErrorMessage(error), "error"));
    return () => {
      active = false;
    };
  }, [showToast, tenantContextId]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await api.post("/positions", {
        title: form.title,
        levelName: form.levelName,
        parentPositionId: form.parentPositionId || null,
      });
      setForm({ title: "", levelName: "", parentPositionId: "" });
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const loadSubtree = async (positionId) => {
    try {
      const res = await api.get(`/positions/${positionId}/subtree`);
      setSubtree(res.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Positions" description="Manage hierarchy positions for the active tenant (see banner).">
      <TenantScopeBanner context="Positions" />
      <form className="inline-form" onSubmit={create}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
        <input placeholder="Level name" value={form.levelName} onChange={(e) => setForm((p) => ({ ...p, levelName: e.target.value }))} required />
        <input
          placeholder="Parent position ID (optional)"
          value={form.parentPositionId}
          onChange={(e) => setForm((p) => ({ ...p, parentPositionId: e.target.value }))}
        />
        <button className="btn-primary" type="submit">
          Create
        </button>
      </form>
      <DataTable
        columns={[
          { key: "_id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "levelName", label: "Level" },
          { key: "parentPositionId", label: "Parent" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <button className="btn-secondary" type="button" onClick={() => loadSubtree(row._id)}>
                View Subtree
              </button>
            ),
          },
        ]}
        rows={items}
      />
      <h3>Subtree (root + descendants)</h3>
      <p className="small-note">API returns full position rows for this tenant under the selected node.</p>
      <DataTable
        columns={[
          { key: "_id", label: "ID", render: (row) => String(row._id) },
          { key: "title", label: "Title" },
          { key: "levelName", label: "Level" },
          {
            key: "parentPositionId",
            label: "Parent",
            render: (row) => (row.parentPositionId ? String(row.parentPositionId) : "—"),
          },
        ]}
        rows={subtree}
        emptyText="Click View Subtree on a position to load its hierarchy slice."
      />
    </ModulePage>
  );
}

export default PositionsPage;
