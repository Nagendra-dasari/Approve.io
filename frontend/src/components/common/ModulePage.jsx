import { useState } from "react";

function ModulePage({ title, description, actions, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <div className="module-header-actions">
          {actions}
          <button type="button" className="btn-secondary" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>
      {!collapsed ? children : null}
    </section>
  );
}

export default ModulePage;
