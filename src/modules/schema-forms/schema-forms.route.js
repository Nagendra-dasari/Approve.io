const path = require("path");
const express = require("express");
const env = require("../../config/env");

process.env.PINK_FORM_SUBMISSIONS_PATH = env.PINK_FORM_SUBMISSIONS_PATH;

const router = express.Router();

function tryRequire(mod) {
  try { return require(mod); } catch { return null; }
}

const modulesRouter = tryRequire(path.join(__dirname, "..", "..", "..", "pink-form", "src", "routes", "modules"));
const submissionsRouter = tryRequire(path.join(__dirname, "..", "..", "..", "pink-form", "src", "routes", "submissions"));
const seedRouter = tryRequire(path.join(__dirname, "..", "..", "..", "pink-form", "src", "routes", "seed"));

if (modulesRouter) router.use("/modules", modulesRouter);
if (submissionsRouter) router.use("/submissions", submissionsRouter);
if (seedRouter) router.use("/seed", seedRouter);

router.use("/", (req, res) => {
  res.status(503).json({ message: "Schema forms module not available" });
});

module.exports = router;
