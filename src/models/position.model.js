const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    levelName: { type: String, required: true, trim: true },
    parentPositionId: { type: mongoose.Schema.Types.ObjectId, ref: "Position", default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

positionSchema.index({ tenantId: 1, parentPositionId: 1 });

module.exports = mongoose.model("Position", positionSchema);
