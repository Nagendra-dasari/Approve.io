const express = require("express");
const authRoutes = require("../modules/auth/auth.route");
const userRoutes = require("../modules/users/users.route");
const tenantRoutes = require("../modules/tenants/tenants.route");
const roleRoutes = require("../modules/roles/roles.route");
const permissionRoutes = require("../modules/permissions/permissions.route");
const positionRoutes = require("../modules/positions/positions.route");
const assignmentRoutes = require("../modules/assignments/assignments.route");
const workflowRoutes = require("../modules/workflows/workflows.route");
const formsRoutes = require("../modules/forms/forms.route");
const kycRoutes = require("../modules/kyc/kyc.route");
const signaturesRoutes = require("../modules/signatures/signatures.route");
const documentsRoutes = require("../modules/documents/documents.route");
const notificationsRoutes = require("../modules/notifications/notifications.route");
const importsRoutes = require("../modules/imports/imports.route");
const auditRoutes = require("../modules/audit/audit.route");
const publicRoutes = require("../modules/public/public.route");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "pink-api" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tenants", tenantRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/positions", positionRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/workflows", workflowRoutes);
router.use("/forms", formsRoutes);
router.use("/kyc", kycRoutes);
router.use("/signatures", signaturesRoutes);
router.use("/documents", documentsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/imports", importsRoutes);
router.use("/audit", auditRoutes);
router.use("/public", publicRoutes);

module.exports = router;
