import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";
import useAuth from "../../../hooks/useAuth";

function permissionOptionLabel(p) {
  return `${p.code} — ${p.module} / ${p.action}`;
}

function RolesPage() {
  const { showToast } = useToast();
  const { tenantContextId } = useAuth();
  const [items, setItems] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [selectedCodes, setSelectedCodes] = useState([]);

  const sortedPermissions = useMemo(
    () => [...permissions].sort((a, b) => String(a.code).localeCompare(String(b.code))),
    [permissions],
  );

  const load = useCallback(async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([api.get("/roles"), api.get("/permissions")]);
      setItems(rolesRes.data || []);
      setPermissions(permsRes.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load, tenantContextId]);

  useEffect(() => {
    setForm({ name: "" });
    setSelectedCodes([]);
  }, [tenantContextId]);

  const toggleCode = (code) => {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const selectAllInModule = (module) => {
    const codes = sortedPermissions.filter((p) => p.module === module).map((p) => p.code);
    setSelectedCodes((prev) => [...new Set([...prev, ...codes])]);
  };

  const clearSelection = () => setSelectedCodes([]);

  const removeRole = async (row) => {
    if (row.type === "SYSTEM") return;
    if (!window.confirm(`Delete role "${row.name}" for this tenant?`)) return;
    try {
      await api.delete(`/roles/${row._id}`);
      showToast("Role deleted", "success");
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const create = async (event) => {
    event.preventDefault();
    if (selectedCodes.length === 0) {
      showToast("Select at least one permission below.", "error");
      return;
    }
    try {
      await api.post("/roles", { name: form.name, permissionCodes: selectedCodes });
      setForm({ name: "" });
      setSelectedCodes([]);
      showToast("Role created", "success");
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const modules = useMemo(() => [...new Set(sortedPermissions.map((p) => p.module))].sort(), [sortedPermissions]);

  return (
    <ModulePage
      title="Roles"
      description="Pick permissions by name (code). IDs are resolved on the server. Use the People page to assign roles to employee IDs."
      actions={
        <Link to="/permissions" className="small-note">
          Open full permission catalog (reference)
        </Link>
      }
    >
      <TenantScopeBanner context="Roles" />
      <form className="stacked-form" onSubmit={create}>
        <div className="inline-form">
          <input
            placeholder="Role name (e.g. Payroll Approver)"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <button className="btn-primary" type="submit">
            Create role
          </button>
        </div>
        <div className="permission-picker">
          <div className="permission-picker-toolbar">
            <span>
              Selected: <strong>{selectedCodes.length}</strong> permission{selectedCodes.length === 1 ? "" : "s"}
            </span>
            <button type="button" className="btn-secondary" onClick={clearSelection}>
              Clear selection
            </button>
          </div>
          <div className="permission-picker-grid">
            {modules.map((mod) => (
              <div key={mod} className="permission-picker-module">
                <div className="permission-picker-module-head">
                  <strong>{mod}</strong>
                  <button type="button" className="btn-linkish" onClick={() => selectAllInModule(mod)}>
                    Add all in module
                  </button>
                </div>
                <ul className="permission-check-list">
                  {sortedPermissions
                    .filter((p) => p.module === mod)
                    .map((p) => (
                      <li key={p.code}>
                        <label className="permission-check-item">
                          <input
                            type="checkbox"
                            checked={selectedCodes.includes(p.code)}
                            onChange={() => toggleCode(p.code)}
                          />
                          <span>{permissionOptionLabel(p)}</span>
                        </label>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </form>
      <h3>Existing roles</h3>
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "type", label: "Type" },
          {
            key: "permissionIds",
            label: "Permissions",
            render: (row) =>
              (row.permissionIds || [])
                .map((p) => (typeof p === "object" && p?.code ? p.code : String(p)))
                .join(", ") || "—",
          },
          {
            key: "actions",
            label: "",
            render: (row) =>
              row.type === "SYSTEM" ? (
                <span className="small-note">—</span>
              ) : (
                <button className="btn-secondary" type="button" onClick={() => removeRole(row)}>
                  Delete
                </button>
              ),
          },
        ]}
        rows={items}
      />
    </ModulePage>
  );
}

export default RolesPage;
