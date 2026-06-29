const { execSync } = require("child_process");
const path = require("path");

const frontendDir = path.join(__dirname, "frontend");

try {
  console.log("Installing frontend deps in:", frontendDir);
  execSync("npm install --include=dev", { cwd: frontendDir, stdio: "inherit" });

  console.log("Running vite build...");
  execSync("node node_modules/vite/bin/vite.js build", { cwd: frontendDir, stdio: "inherit" });

  console.log("Build complete!");
} catch (err) {
  console.error("BUILD FAILED:", err.message);
  process.exit(1);
}
