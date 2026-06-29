const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const path = require("path");
const env = require("./config/env");
const sanitizeMiddleware = require("./middlewares/sanitize.middleware");
const requestLogger = require("./middlewares/requestLogger.middleware");
const errorMiddleware = require("./middlewares/error.middleware");
const routes = require("./routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeMiddleware);
app.use(hpp());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 500 : 1000,
});
app.use(limiter);

app.use("/api/v1", routes);

try {
  const swaggerUi = require("swagger-ui-express");
  const YAML = require("yamljs");
  const docsPath = path.resolve(__dirname, "docs/openapi/openapi.yaml");
  const openapiDoc = YAML.load(docsPath);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
} catch {
  /* swagger docs optional — skip if yaml or module missing */
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorMiddleware);

module.exports = app;
