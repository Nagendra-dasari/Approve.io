const { execSync } = require("child_process");
execSync("node node_modules/vite/bin/vite.js build", { cwd: "frontend", stdio: "inherit" });
