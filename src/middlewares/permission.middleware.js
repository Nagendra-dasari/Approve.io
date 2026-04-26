const ApiError = require("../common/errors/ApiError");

function permissionMiddleware(permissionCode) {
  return (req, res, next) => {
    const permissionCodes = req.auth?.permissionCodes || [];

    if (!permissionCodes.includes(permissionCode)) {
      return next(new ApiError(403, `Missing permission: ${permissionCode}`));
    }

    return next();
  };
}

module.exports = permissionMiddleware;
