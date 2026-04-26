const tenantsService = require("./tenants.service");

async function createTenant(req, res, next) {
  try {
    const tenant = await tenantsService.createTenant(req.body, req.auth);
    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
}

async function listTenants(req, res, next) {
  try {
    const tenants = await tenantsService.listTenants();
    res.status(200).json(tenants);
  } catch (error) {
    next(error);
  }
}

async function updateTenant(req, res, next) {
  try {
    const tenant = await tenantsService.updateTenant(req.params.tenantId, req.body, req.auth);
    res.status(200).json(tenant);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTenant,
  listTenants,
  updateTenant,
};
