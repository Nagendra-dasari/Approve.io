const User = require("../../models/user.model");
const ApiError = require("../../common/errors/ApiError");
const { writeAudit } = require("../../services/audit.service");

async function listUsers(tenantId) {
  return User.find({ tenantId }).populate("roleIds").populate("currentPositionId").sort({ createdAt: -1 });
}

async function updateUser(tenantId, userId, payload, actor) {
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const trimmedEmp = payload.empCode !== undefined && payload.empCode ? String(payload.empCode).trim() : null;
  if (trimmedEmp) {
    const dup = await User.findOne({ tenantId, empCode: trimmedEmp, _id: { $ne: userId } });
    if (dup) {
      throw new ApiError(409, "Employee ID is already used by another person in this tenant");
    }
  }

  const update = {};
  if (payload.name !== undefined) {
    update.name = payload.name;
  }
  if (payload.empCode !== undefined) {
    update.empCode = trimmedEmp;
  }
  if (payload.roleIds !== undefined) {
    update.roleIds = payload.roleIds;
  }
  if (payload.currentPositionId !== undefined) {
    const pid = payload.currentPositionId && String(payload.currentPositionId).trim();
    update.currentPositionId = pid || null;
  }

  const updated = await User.findOneAndUpdate({ _id: userId, tenantId }, update, { returnDocument: "after" })
    .populate("roleIds")
    .populate("currentPositionId");

  await writeAudit({
    tenantId,
    userId: actor?.userId || null,
    action: "USER_UPDATED",
    metadata: { targetUserId: userId, fields: Object.keys(update) },
  });

  return updated;
}

module.exports = {
  listUsers,
  updateUser,
};
