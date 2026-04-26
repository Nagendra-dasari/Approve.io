export const ROUTE_PERMISSIONS = {
  "/setup-checklist": [],
  "/permission-matrix": ["role.view"],
  "/tenants": ["tenant.manage"],
  "/roles": ["role.view"],
  "/permissions": ["role.view"],
  "/positions": ["employee.view"],
  "/people": ["user.view"],
  "/assignments": ["employee.view"],
  "/workflows": ["workflow.submit"],
  "/forms": ["form.view"],
  "/public-links": ["form.publish"],
  "/kyc": ["workflow.submit"],
  "/signatures": ["workflow.submit"],
  "/documents": ["report.view"],
  "/imports": ["employee.assign"],
  "/notifications": ["report.view"],
  "/audit": ["audit.view"],
};

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { to: "/", label: "Dashboard", permissions: [] },
      { to: "/setup-checklist", label: "Setup Checklist", permissions: ROUTE_PERMISSIONS["/setup-checklist"] },
      { to: "/permission-matrix", label: "Permission Matrix", permissions: ROUTE_PERMISSIONS["/permission-matrix"] },
      { to: "/tenants", label: "Tenants", permissions: ROUTE_PERMISSIONS["/tenants"] },
      { to: "/roles", label: "Roles", permissions: ROUTE_PERMISSIONS["/roles"] },
      { to: "/permissions", label: "Permissions", permissions: ROUTE_PERMISSIONS["/permissions"] },
      { to: "/positions", label: "Positions", permissions: ROUTE_PERMISSIONS["/positions"] },
      { to: "/people", label: "People", permissions: ROUTE_PERMISSIONS["/people"] },
      { to: "/assignments", label: "Assignments", permissions: ROUTE_PERMISSIONS["/assignments"] },
    ],
  },
  {
    title: "Workflow",
    items: [
      { to: "/workflows", label: "Workflows", permissions: ROUTE_PERMISSIONS["/workflows"] },
      { to: "/forms", label: "Forms", permissions: ROUTE_PERMISSIONS["/forms"] },
      { to: "/public-links", label: "Public Links", permissions: ROUTE_PERMISSIONS["/public-links"] },
    ],
  },
  {
    title: "Compliance",
    items: [
      { to: "/kyc", label: "KYC", permissions: ROUTE_PERMISSIONS["/kyc"] },
      { to: "/signatures", label: "Signatures", permissions: ROUTE_PERMISSIONS["/signatures"] },
      { to: "/documents", label: "Documents", permissions: ROUTE_PERMISSIONS["/documents"] },
      { to: "/imports", label: "Imports", permissions: ROUTE_PERMISSIONS["/imports"] },
      { to: "/notifications", label: "Notifications", permissions: ROUTE_PERMISSIONS["/notifications"] },
      { to: "/audit", label: "Audit Logs", permissions: ROUTE_PERMISSIONS["/audit"] },
    ],
  },
];

export function canAccessRoute(path, permissionCodes = []) {
  const required = ROUTE_PERMISSIONS[path] || [];
  if (!required.length) return true;
  return required.some((code) => permissionCodes.includes(code));
}

export function getNavSections(permissionCodes = []) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessRoute(item.to, permissionCodes)),
  })).filter((section) => section.items.length > 0);
}

export function getRbacHbacGuidance() {
  return [
    "RBAC: route and action access is controlled by permission codes.",
    "HBAC: position and assignment modules enforce hierarchy-aware operations.",
    "Approval workflows should map approver position IDs to your hierarchy tree.",
  ];
}
