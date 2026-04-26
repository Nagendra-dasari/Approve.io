import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getNavSections } from "../lib/access-control";
import api from "../lib/api";

function AppLayout() {
  const { logout, user, permissionCodes = [], tenantContextId, setTenantContext } = useAuth();
  const [tenants, setTenants] = useState([]);
  const navSections = getNavSections(permissionCodes);
  const canManageTenants = permissionCodes.includes("tenant.manage");

  useEffect(() => {
    let active = true;
    if (!canManageTenants) {
      return () => {
        active = false;
      };
    }
    api
      .get("/tenants")
      .then((res) => {
        if (active) {
          setTenants(res.data || []);
        }
      })
      .catch(() => {
        if (active) {
          setTenants([]);
        }
      });
    return () => {
      active = false;
    };
  }, [canManageTenants]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Pink SaaS Admin</h1>
          <p className="topbar-subtitle">{user?.email || "Authenticated user"}</p>
          <p className="topbar-subtitle">Permissions: {permissionCodes.length}</p>
          {canManageTenants ? (
            <p className="topbar-subtitle">
              Tenant context: {tenantContextId || user?.tenantId || "default"}
            </p>
          ) : null}
        </div>
        <div className="topbar-actions">
          {canManageTenants ? (
            <select
              className="tenant-context-select"
              aria-label="Act as tenant for org-scoped APIs"
              title="Sets X-Tenant-Id on requests so roles, positions, assignments, and invites apply to the chosen tenant"
              value={tenantContextId}
              onChange={(e) => setTenantContext(e.target.value)}
            >
              <option value="">Home tenant only (no override)</option>
              {tenants.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.name} ({tenant.code})
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>
      <div className="shell-body">
        <aside className="sidebar">
          {navSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <h3>{section.title}</h3>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
