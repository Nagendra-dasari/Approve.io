const { execSync } = require("child_process");
execSync("npm install", { cwd: "frontend", stdio: "inherit" });
execSync("npx vite build", { cwd: "frontend", stdio: "inherit" });
