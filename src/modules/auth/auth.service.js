const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../models/user.model");
const Tenant = require("../../models/tenant.model");
const RefreshToken = require("../../models/refreshToken.model");
const Role = require("../../models/role.model");
const ApiError = require("../../common/errors/ApiError");
const env = require("../../config/env");
const { signAccessToken, signRefreshToken } = require("../../services/token.service");
const { writeAudit } = require("../../services/audit.service");
const notificationAdapter = require("../notifications/notification.adapter");

function generateOtpCode() {
  if (env.NODE_ENV !== "production" && env.DEV_OTP) {
    return env.DEV_OTP;
  }
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function resolvePermissionCodes(tenantId, roleIds = []) {
  if (!roleIds.length) {
    return [];
  }

  const validRoleIds = roleIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!validRoleIds.length) {
    return [];
  }

  const roles = await Role.find({ tenantId, _id: { $in: validRoleIds } }).populate("permissionIds", "code");
  const codes = new Set();
  for (const role of roles) {
    for (const perm of role.permissionIds || []) {
      if (perm?.code) {
        codes.add(perm.code);
      }
    }
  }
  return Array.from(codes);
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const tenant = await Tenant.findById(user.tenantId);
  if (!tenant || tenant.status !== "ACTIVE") {
    throw new ApiError(403, "Tenant is inactive");
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(423, "Account temporarily locked due to failed login attempts");
  }

  if (user.status !== "ACTIVE" || user.status === "DISABLED") {
    throw new ApiError(403, "Account is not active");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash || "");
  if (!isValid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.status = "LOCKED";
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    throw new ApiError(401, "Invalid credentials");
  }

  const payload = {
    userId: user._id,
    tenantId: user.tenantId,
    roleIds: user.roleIds,
    positionId: user.currentPositionId,
    permissionCodes: await resolvePermissionCodes(user.tenantId, user.roleIds),
  };

  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const refreshToken = signRefreshToken(payload);
  await RefreshToken.create({
    userId: user._id,
    tenantId: user.tenantId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await writeAudit({
    tenantId: user.tenantId,
    userId: user._id,
    action: "AUTH_LOGIN",
    metadata: { email: user.email },
  });

  return {
    accessToken: signAccessToken(payload),
    refreshToken,
    user: {
      id: user._id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      empCode: user.empCode || null,
      roleIds: user.roleIds,
      currentPositionId: user.currentPositionId,
    },
    permissionCodes: payload.permissionCodes,
  };
}

async function inviteUser({ tenantId, name, email, empCode = null, roleIds = [], currentPositionId = null }) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const trimmedEmp = empCode ? String(empCode).trim() : null;

  if (trimmedEmp) {
    const empDup = await User.findOne({ tenantId, empCode: trimmedEmp, email: { $ne: normalizedEmail } });
    if (empDup) {
      throw new ApiError(409, "Employee ID is already used by another person in this tenant");
    }
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const otpCode = generateOtpCode();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const user = await User.findOneAndUpdate(
    { tenantId, email: normalizedEmail },
    {
      tenantId,
      name,
      email: normalizedEmail,
      empCode: trimmedEmp,
      roleIds,
      currentPositionId,
      status: "OTP_PENDING",
      inviteToken,
      inviteExpiry,
      otpCode,
      otpExpiry,
      otpVerified: false,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await writeAudit({
    tenantId,
    action: "USER_INVITED",
    metadata: { userId: user._id, email: normalizedEmail },
  });

  await notificationAdapter.sendEmail({
    to: email,
    subject: "You are invited",
    html: `Invite token: ${inviteToken} and OTP: ${otpCode}`,
  });

  return {
    userId: user._id,
    inviteToken,
    otpCode,
    inviteExpiry,
  };
}

async function verifyOtp({ inviteToken, otpCode }) {
  const user = await User.findOne({ inviteToken }).select("+inviteToken +inviteExpiry +otpCode +otpExpiry");
  if (!user) {
    throw new ApiError(400, "Invalid invite token");
  }
  if (!user.inviteExpiry || user.inviteExpiry < new Date()) {
    throw new ApiError(400, "Invite token expired");
  }
  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    throw new ApiError(400, "OTP expired");
  }
  if (user.otpCode !== otpCode) {
    throw new ApiError(400, "Invalid OTP");
  }

  user.otpVerified = true;
  await user.save();

  return { message: "OTP verified" };
}

async function setPassword({ inviteToken, password }) {
  const user = await User.findOne({ inviteToken }).select("+inviteToken +inviteExpiry");
  if (!user) {
    throw new ApiError(400, "Invalid invite token");
  }
  if (!user.otpVerified) {
    throw new ApiError(400, "OTP verification required");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  user.passwordHash = passwordHash;
  user.status = "ACTIVE";
  user.inviteToken = null;
  user.inviteExpiry = null;
  user.otpCode = null;
  user.otpExpiry = null;
  await user.save();

  await writeAudit({
    tenantId: user.tenantId,
    userId: user._id,
    action: "AUTH_PASSWORD_SET",
  });

  return { message: "Password set successfully" };
}

async function refresh({ refreshToken }) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const savedToken = await RefreshToken.findOne({
    userId: decoded.userId,
    tokenHash: hashToken(refreshToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!savedToken) {
    throw new ApiError(401, "Refresh token not recognized");
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.status !== "ACTIVE") {
    throw new ApiError(401, "User not active");
  }

  savedToken.revokedAt = new Date();
  await savedToken.save();

  const payload = {
    userId: user._id,
    tenantId: user.tenantId,
    roleIds: user.roleIds,
    positionId: user.currentPositionId,
    permissionCodes: await resolvePermissionCodes(user.tenantId, user.roleIds),
  };

  const nextRefresh = signRefreshToken(payload);
  await RefreshToken.create({
    userId: user._id,
    tenantId: user.tenantId,
    tokenHash: hashToken(nextRefresh),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken: signAccessToken(payload),
    refreshToken: nextRefresh,
    permissionCodes: payload.permissionCodes,
  };
}

async function resendInvite({ tenantId, email }) {
  const user = await User.findOne({ tenantId, email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const result = await inviteUser({
    tenantId,
    name: user.name,
    email: user.email,
    roleIds: user.roleIds,
    currentPositionId: user.currentPositionId,
  });

  return { message: "Invite resent", ...result };
}

async function forgotPassword({ email }) {
  const user = await User.findOne({ email }).select("+resetToken +resetExpiry");
  if (!user) {
    return { message: "If user exists, reset email has been sent" };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  user.resetToken = resetToken;
  user.resetExpiry = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  await notificationAdapter.sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `Reset token: ${resetToken}`,
  });

  return { message: "If user exists, reset email has been sent" };
}

async function resetPassword({ resetToken, password }) {
  const user = await User.findOne({ resetToken }).select("+resetToken +resetExpiry");
  if (!user || !user.resetExpiry || user.resetExpiry < new Date()) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetToken = null;
  user.resetExpiry = null;
  user.status = "ACTIVE";
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });

  await writeAudit({
    tenantId: user.tenantId,
    userId: user._id,
    action: "AUTH_PASSWORD_RESET",
  });
  return { message: "Password reset successful" };
}

module.exports = {
  login,
  inviteUser,
  verifyOtp,
  setPassword,
  refresh,
  resendInvite,
  forgotPassword,
  resetPassword,
};
