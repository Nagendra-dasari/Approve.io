const Joi = require("joi");
const ApiError = require("../../common/errors/ApiError");

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(new ApiError(422, "Validation failed", error.details));
    }
    req.body = value;
    return next();
  };
}

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const inviteSchema = Joi.object({
  tenantId: Joi.string().required(),
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  empCode: Joi.string().trim().max(64).allow(null, "").optional(),
  roleIds: Joi.array().items(Joi.string()).default([]),
  currentPositionId: Joi.string().allow(null).default(null),
});

const verifyOtpSchema = Joi.object({
  inviteToken: Joi.string().required(),
  otpCode: Joi.string().length(6).required(),
});

const setPasswordSchema = Joi.object({
  inviteToken: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const resendInviteSchema = Joi.object({
  tenantId: Joi.string().required(),
  email: Joi.string().email().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

module.exports = {
  validate,
  loginSchema,
  inviteSchema,
  verifyOtpSchema,
  setPasswordSchema,
  refreshSchema,
  resendInviteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
