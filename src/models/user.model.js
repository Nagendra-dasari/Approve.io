const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    empCode: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: null },
    passwordHash: { type: String, default: null, select: false },
    status: {
      type: String,
      enum: ["INVITED", "OTP_PENDING", "ACTIVE", "DISABLED", "LOCKED"],
      default: "INVITED",
      index: true,
    },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    currentPositionId: { type: mongoose.Schema.Types.ObjectId, ref: "Position", default: null },
    inviteToken: { type: String, default: null, index: true, select: false },
    inviteExpiry: { type: Date, default: null, select: false },
    otpCode: { type: String, default: null, select: false },
    otpExpiry: { type: Date, default: null, select: false },
    otpVerified: { type: Boolean, default: false },
    resetToken: { type: String, default: null, select: false, index: true },
    resetExpiry: { type: Date, default: null, select: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, empCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
