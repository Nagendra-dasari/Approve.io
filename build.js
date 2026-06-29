const { execSync } = require("child_process");
execSync("npm install", { cwd: "frontend", stdio: "inherit" });
execSync("node node_modules/vite/bin/vite.js build", { cwd: "frontend", stdio: "inherit" });
