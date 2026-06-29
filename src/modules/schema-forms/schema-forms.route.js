const path = require("path");
const express = require("express");
const env = require("../../config/env");

process.env.PINK_FORM_SUBMISSIONS_PATH = env.PINK_FORM_SUBMISSIONS_PATH;

const router = express.Router();

try {
  const pinkFormRoot = path.resolve(__dirname, "..", "..", "..", "pink-form", "src", "routes");
  const modulesRouter = require(path.join(pinkFormRoot, "modules"));
  const submissionsRouter = require(path.join(pinkFormRoot, "submissions"));
  const seedRouter = require(path.join(pinkFormRoot, "seed"));

  router.use("/modules", modulesRouter);
  router.use("/submissions", submissionsRouter);
  router.use("/seed", seedRouter);
} catch {
  router.use("/", (req, res) => {
    res.status(503).json({ message: "Schema forms module not available" });
  });
}

module.exports = router;
