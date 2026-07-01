const express = require("express");
const env = require("../../config/env");

process.env.PINK_FORM_SUBMISSIONS_PATH = env.PINK_FORM_SUBMISSIONS_PATH;

const router = express.Router();

let modulesRouter, submissionsRouter, seedRouter;

try {
  modulesRouter = require("../../../pink-form/src/routes/modules");
  submissionsRouter = require("../../../pink-form/src/routes/submissions");
  seedRouter = require("../../../pink-form/src/routes/seed");
} catch (err) {
  console.error("[schema-forms] Failed to load pink-form routers:", err.message);
}

if (modulesRouter) router.use("/modules", modulesRouter);
if (submissionsRouter) router.use("/submissions", submissionsRouter);
if (seedRouter) router.use("/seed", seedRouter);

if (!modulesRouter && !submissionsRouter && !seedRouter) {
  router.use("/", (_req, res) => {
    res.status(503).json({ message: "Schema forms module not available" });
  });
}

module.exports = router;
