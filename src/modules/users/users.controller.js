const usersService = require("./users.service");

async function listUsers(req, res, next) {
  try {
    const users = await usersService.listUsers(req.tenantId);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await usersService.updateUser(req.tenantId, req.params.userId, req.body, req.auth);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  updateUser,
};
