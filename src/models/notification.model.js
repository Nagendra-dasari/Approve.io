const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    channel: { type: String, enum: ["EMAIL", "SMS", "WHATSAPP", "IN_APP"], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING", index: true },
    eventType: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
