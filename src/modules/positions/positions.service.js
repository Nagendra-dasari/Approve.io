const Position = require("../../models/position.model");
const ApiError = require("../../common/errors/ApiError");
const { writeAudit } = require("../../services/audit.service");
const { getSubtreePositionIds } = require("./hierarchy.service");

async function createPosition(tenantId, payload, actor) {
  if (payload.parentPositionId) {
    const parent = await Position.findOne({ _id: payload.parentPositionId, tenantId, status: "ACTIVE" });
    if (!parent) {
      throw new ApiError(404, "Parent position not found");
    }
  }

  const position = await Position.create({ tenantId, ...payload });
  await writeAudit({
    tenantId,
    userId: actor?.userId || null,
    action: "POSITION_CREATED",
    metadata: { positionId: position._id },
  });
  return position;
}

async function listPositions(tenantId) {
  return Position.find({ tenantId }).sort({ createdAt: 1 });
}

async function updatePosition(tenantId, positionId, payload, actor) {
  if (payload.parentPositionId && String(payload.parentPositionId) === String(positionId)) {
    throw new ApiError(400, "Position cannot be parent of itself");
  }

  const position = await Position.findOneAndUpdate(
    { _id: positionId, tenantId },
    payload,
    { returnDocument: "after" },
  );
  if (!position) {
    throw new ApiError(404, "Position not found");
  }

  await writeAudit({
    tenantId,
    userId: actor?.userId || null,
    action: "POSITION_UPDATED",
    metadata: { positionId },
  });
  return position;
}

async function getSubtree(tenantId, positionId) {
  const ids = await getSubtreePositionIds(tenantId, positionId);
  return Position.find({ _id: { $in: ids }, tenantId });
}

module.exports = {
  createPosition,
  listPositions,
  updatePosition,
  getSubtree,
};
