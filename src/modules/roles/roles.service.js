const Role = require("../../models/role.model");
const Permission = require("../../models/permission.model");
const ApiError = require("../../common/errors/ApiError");
const { writeAudit } = require("../../services/audit.service");

async function resolvePermissionIds(payload) {
  const ids = new Set();
  if (payload.permissionIds?.length) {
    for (const id of payload.permissionIds) {
      ids.add(String(id));
    }
  }
  if (payload.permissionCodes?.length) {
    const found = await Permission.find({ code: { $in: payload.permissionCodes } });
    const foundCodes = new Set(found.map((p) => p.code));
    const missing = payload.permissionCodes.filter((c) => !foundCodes.has(c));
    if (missing.length) {
      throw new ApiError(400, `Unknown permission codes: ${missing.join(", ")}`);
    }
    for (const p of found) {
      ids.add(String(p._id));
    }
  }
  const list = [...ids];
  if (!list.length) {
    throw new ApiError(400, "Select at least one permission");
  }
  return list;
}

async function createRole(tenantId, payload, actor) {
  const existing = await Role.findOne({ tenantId, name: payload.name });
  if (existing) {
    throw new ApiError(409, "Role already exists");
  }

  const permissionIds = await resolvePermissionIds({
    permissionIds: payload.permissionIds,
    permissionCodes: payload.permissionCodes,
  });

  const role = await Role.create({
    tenantId,
    name: payload.name,
    type: payload.type || "CUSTOM",
    permissionIds,
  });

  await writeAudit({
    tenantId,
    userId: actor?.userId || null,
    action: "ROLE_CREATED",
    metadata: { roleId: role._id },
  });

  return Role.findById(role._id).populate("permissionIds");
}

async function listRoles(tenantId) {
  return Role.find({ tenantId }).populate("permissionIds");
}

async function updateRole(tenantId, roleId, payload, actor) {
  const update = {};
  if (payload.name !== undefined) {
    update.name = payload.name;
  }
  if (payload.permissionIds !== undefined || payload.permissionCodes !== undefined) {
    update.permissionIds = await resolvePermissionIds({
      permissionIds: payload.permissionIds || [],
      permissionCodes: payload.permissionCodes || [],
    });
  }

  const role = await Role.findOneAndUpdate({ _id: roleId, tenantId }, update, { returnDocument: "after" }).populate(
    "permissionIds",
  );
  if (!role) {
    throw new ApiError(404, "Role not found");
  }
  await writeAudit({
    tenantId,
    userId: actor?.userId || null,
    action: "ROLE_UPDATED",
    metadata: { roleId: role._id },
  });
  return role;
}

async function deleteRole(tenantId, roleId, actor) {
  const role = await Role.findOne({ _id: roleId, tenantId });
  if (!role) {
    throw new ApiError(404, "Role not found");
  }
  if (role.type === "SYSTEM") {
    throw new ApiError(403, "System roles cannot be deleted");
  }
  await Role.deleteOne({ _id: roleId, tenantId });
  await writeAudit({
    tenantId,
    userId: actor?.userId || null,
    action: "ROLE_DELETED",
    metadata: { roleId: role._id },
  });
}

module.exports = {
  createRole,
  listRoles,
  updateRole,
  deleteRole,
};
