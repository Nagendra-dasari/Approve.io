const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["SYSTEM", "CUSTOM"], default: "CUSTOM" },
    permissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
  },
  { timestamps: true }
);

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
