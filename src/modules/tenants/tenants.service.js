const Tenant = require("../../models/tenant.model");
const ApiError = require("../../common/errors/ApiError");
const { writeAudit } = require("../../services/audit.service");

async function createTenant(payload, actor) {
  const existing = await Tenant.findOne({ code: payload.code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, "Tenant code already exists");
  }

  const tenant = await Tenant.create({
    ...payload,
    code: payload.code.toUpperCase(),
  });

  await writeAudit({
    tenantId: null,
    userId: actor?.userId || null,
    action: "TENANT_CREATED",
    metadata: { tenantId: tenant._id, code: tenant.code },
  });

  return tenant;
}

async function listTenants() {
  return Tenant.find().sort({ createdAt: -1 });
}

async function updateTenant(tenantId, payload, actor) {
  const tenant = await Tenant.findByIdAndUpdate(tenantId, payload, { returnDocument: "after" });
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  await writeAudit({
    tenantId: tenant._id,
    userId: actor?.userId || null,
    action: "TENANT_UPDATED",
    metadata: payload,
  });

  return tenant;
}

module.exports = {
  createTenant,
  listTenants,
  updateTenant,
};
