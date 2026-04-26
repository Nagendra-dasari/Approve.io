const express = require("express");
const Joi = require("joi");
const KycRecord = require("../../models/kycRecord.model");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const adapter = require("./kyc.adapter");
const ApiError = require("../../common/errors/ApiError");

const router = express.Router();

router.post("/initiate", authMiddleware, tenantMiddleware, permissionMiddleware("workflow.submit"), async (req, res, next) => {
  try {
    const schema = Joi.object({
      refType: Joi.string().valid("EXTERNAL_USER", "SUBMISSION").required(),
      refId: Joi.string().required(),
      aadhaarNumber: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ApiError(422, "Validation failed", error.details);
    }

    const init = await adapter.initiateAadhaarOtp(value);
    const record = await KycRecord.create({
      tenantId: req.tenantId,
      refType: value.refType,
      refId: value.refId,
      status: "PENDING",
      providerResponseMeta: { providerRef: init.providerRef },
    });
    res.status(201).json({ kycId: record._id, providerRef: init.providerRef });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", authMiddleware, tenantMiddleware, permissionMiddleware("workflow.submit"), async (req, res, next) => {
  try {
    const schema = Joi.object({
      kycId: Joi.string().required(),
      providerRef: Joi.string().required(),
      otp: Joi.string().required(),
      pan: Joi.string().optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ApiError(422, "Validation failed", error.details);
    }
    const record = await KycRecord.findOne({ _id: value.kycId, tenantId: req.tenantId });
    if (!record) {
      throw new ApiError(404, "KYC record not found");
    }
    const aadhaarResult = await adapter.verifyAadhaarOtp(value);
    record.aadhaarTokenHash = aadhaarResult.tokenHash;
    record.status = aadhaarResult.status;
    if (value.pan) {
      const panResult = await adapter.verifyPan({ pan: value.pan });
      record.panTokenHash = panResult.tokenHash;
      if (record.status === "VERIFIED" && panResult.status !== "VERIFIED") {
        record.status = "FAILED";
      }
    }
    await record.save();
    res.status(200).json(record);
  } catch (error) {
    next(error);
  }
});

router.get("/:kycId/status", authMiddleware, tenantMiddleware, permissionMiddleware("workflow.submit"), async (req, res, next) => {
  try {
    const record = await KycRecord.findOne({ _id: req.params.kycId, tenantId: req.tenantId });
    if (!record) {
      throw new ApiError(404, "KYC record not found");
    }
    res.status(200).json({ kycId: record._id, status: record.status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
