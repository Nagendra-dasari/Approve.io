const mongoose = require("mongoose");
const env = require("../src/config/env");

let isConnected = false;
let appInstance = null;

async function ensureMongo() {
  if (isConnected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  isConnected = true;
}

async function getApp() {
  if (!appInstance) {
    await ensureMongo();
    appInstance = require("../src/app");
  }
  return appInstance;
}

module.exports = async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("Serverless function error:", err);
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }
};
