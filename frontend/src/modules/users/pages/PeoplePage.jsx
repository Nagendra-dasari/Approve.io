import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";
import useAuth from "../../../hooks/useAuth";

function PeoplePage() {
  const { showToast } = useToast();
  const { user, tenantContextId } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [invite, setInvite] = useState({
    name: "",
    email: "",
    empCode: "",
    roleIds: [],
    currentPositionId: "",
  });
  const [edit, setEdit] = useState({
    userId: "",
    name: "",
    empCode: "",
    roleIds: [],
    currentPositionId: "",
  });

  const effectiveTenantId = useMemo(() => String(tenantContextId || user?.tenantId || "").trim(), [tenantContextId, user?.tenantId]);

  const load = useCallback(async () => {
    try {
      const [uRes, rRes, pRes] = await Promise.all([api.get("/users"), api.get("/roles"), api.get("/positions")]);
      setUsers(uRes.data || []);
      setRoles(rRes.data || []);
      setPositions(pRes.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load, tenantContextId]);

  useEffect(() => {
    setInvite({ name: "", email: "", empCode: "", roleIds: [], currentPositionId: "" });
    setEdit({ userId: "", name: "", empCode: "", roleIds: [], currentPositionId: "" });
  }, [tenantContextId]);

  const submitInvite = async (e) => {
    e.preventDefault();
    if (!effectiveTenantId) {
      showToast("Missing tenant context.", "error");
      return;
    }
    try {
      const res = await api.post("/users/invite", {
        tenantId: effectiveTenantId,
        name: invite.name,
        email: invite.email,
        empCode: invite.empCode.trim() || undefined,
        roleIds: invite.roleIds,
        currentPositionId: invite.currentPositionId || null,
      });
      showToast(`Invited. OTP (dev): check API/email. userId: ${res.data?.userId || ""}`, "success");
      setInvite({ name: "", email: "", empCode: "", roleIds: [], currentPositionId: "" });
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const toggleInviteRole = (id) => {
    const sid = String(id);
    setInvite((p) => ({
      ...p,
      roleIds: p.roleIds.includes(sid) ? p.roleIds.filter((x) => x !== sid) : [...p.roleIds, sid],
    }));
  };

  const startEdit = (row) => {
    setEdit({
      userId: String(row._id),
      name: row.name || "",
      empCode: row.empCode || "",
      roleIds: (row.roleIds || []).map((r) => (typeof r === "object" ? String(r._id) : String(r))),
      currentPositionId: row.currentPositionId
        ? typeof row.currentPositionId === "object"
          ? String(row.currentPositionId._id)
          : String(row.currentPositionId)
        : "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!edit.userId) return;
    try {
      await api.patch(`/users/${edit.userId}`, {
        name: edit.name,
        empCode: edit.empCode.trim() || null,
        roleIds: edit.roleIds,
        currentPositionId: edit.currentPositionId || null,
      });
      showToast("User updated", "success");
      setEdit({ userId: "", name: "", empCode: "", roleIds: [], currentPositionId: "" });
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const toggleEditRole = (id) => {
    const sid = String(id);
    setEdit((p) => ({
      ...p,
      roleIds: p.roleIds.includes(sid) ? p.roleIds.filter((x) => x !== sid) : [...p.roleIds, sid],
    }));
  };

  return (
    <ModulePage
      title="People"
      description="Employee ID (emp code), roles, and seat — aligned to org-sheet style onboarding. Scoped to the tenant selected in the header."
    >
      <TenantScopeBanner context="People" />

      <h3>Invite user</h3>
      <form className="stacked-form" onSubmit={submitInvite}>
        <div className="inline-form">
          <input placeholder="Employee ID (e.g. EMP-1042)" value={invite.empCode} onChange={(e) => setInvite((p) => ({ ...p, empCode: e.target.value }))} />
          <input placeholder="Full name" value={invite.name} onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))} required />
          <input placeholder="Work email" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} required />
        </div>
        <div className="inline-form">
          <select
            value={invite.currentPositionId}
            onChange={(e) => setInvite((p) => ({ ...p, currentPositionId: e.target.value }))}
            aria-label="Default position (optional)"
          >
            <option value="">Position (optional)</option>
            {positions.map((pos) => (
              <option key={pos._id} value={pos._id}>
                {pos.title} — {pos.levelName}
              </option>
            ))}
          </select>
          <button className="btn-primary" type="submit">
            Send invite
          </button>
        </div>
        <div className="permission-picker-module">
          <strong>Roles for this person</strong>
          <ul className="permission-check-list">
            {roles.map((r) => (
              <li key={r._id}>
                <label className="permission-check-item">
                  <input type="checkbox" checked={invite.roleIds.includes(String(r._id))} onChange={() => toggleInviteRole(r._id)} />
                  <span>
                    {r.name} {r.type === "SYSTEM" ? "(system)" : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </form>

      {edit.userId ? (
        <form className="stacked-form edit-user-panel" onSubmit={saveEdit}>
          <h3>Edit user</h3>
          <div className="inline-form">
            <input value={edit.name} onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder="Employee ID" value={edit.empCode} onChange={(e) => setEdit((p) => ({ ...p, empCode: e.target.value }))} />
            <select value={edit.currentPositionId} onChange={(e) => setEdit((p) => ({ ...p, currentPositionId: e.target.value }))}>
              <option value="">No position</option>
              {positions.map((pos) => (
                <option key={pos._id} value={pos._id}>
                  {pos.title}
                </option>
              ))}
            </select>
          </div>
          <ul className="permission-check-list">
            {roles.map((r) => (
              <li key={r._id}>
                <label className="permission-check-item">
                  <input type="checkbox" checked={edit.roleIds.includes(String(r._id))} onChange={() => toggleEditRole(r._id)} />
                  <span>{r.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="inline-form">
            <button className="btn-primary" type="submit">
              Save changes
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEdit({ userId: "", name: "", empCode: "", roleIds: [], currentPositionId: "" })}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <h3>Directory</h3>
      <DataTable
        columns={[
          {
            key: "empCode",
            label: "Employee ID",
            render: (row) => row.empCode || "—",
          },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          {
            key: "roleIds",
            label: "Roles",
            render: (row) =>
              (row.roleIds || [])
                .map((r) => (typeof r === "object" && r?.name ? r.name : String(r)))
                .join(", ") || "—",
          },
          {
            key: "currentPositionId",
            label: "Position",
            render: (row) =>
              row.currentPositionId && typeof row.currentPositionId === "object"
                ? row.currentPositionId.title
                : "—",
          },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <button type="button" className="btn-secondary" onClick={() => startEdit(row)}>
                Edit
              </button>
            ),
          },
        ]}
        rows={users}
      />
    </ModulePage>
  );
}

export default PeoplePage;
