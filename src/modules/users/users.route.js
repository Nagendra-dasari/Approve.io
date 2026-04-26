const express = require("express");
const authController = require("../auth/auth.controller");
const usersController = require("./users.controller");
const { validate: validateAuth, inviteSchema } = require("../auth/auth.validator");
const { validate: validateUsers, patchUserSchema } = require("./users.validator");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");

const router = express.Router();

router.get("/", authMiddleware, tenantMiddleware, permissionMiddleware("user.view"), usersController.listUsers);
router.patch(
  "/:userId",
  authMiddleware,
  tenantMiddleware,
  permissionMiddleware("user.update"),
  validateUsers(patchUserSchema),
  usersController.updateUser
);
router.post(
  "/invite",
  authMiddleware,
  tenantMiddleware,
  permissionMiddleware("user.invite"),
  validateAuth(inviteSchema),
  authController.inviteUser
);

module.exports = router;
