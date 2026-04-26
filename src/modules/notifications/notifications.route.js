const express = require("express");
const Joi = require("joi");
const Notification = require("../../models/notification.model");
const adapter = require("./notification.adapter");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const ApiError = require("../../common/errors/ApiError");

const router = express.Router();

router.post("/", authMiddleware, tenantMiddleware, permissionMiddleware("workflow.submit"), async (req, res, next) => {
  try {
    const schema = Joi.object({
      userId: Joi.string().allow(null).default(null),
      channel: Joi.string().valid("EMAIL", "SMS", "WHATSAPP", "IN_APP").required(),
      message: Joi.string().required(),
      eventType: Joi.string().required(),
      to: Joi.string().allow(null).default(null),
      subject: Joi.string().allow("").default("Notification"),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new ApiError(422, "Validation failed", error.details);
    }
    const notification = await Notification.create({
      tenantId: req.tenantId,
      userId: value.userId,
      channel: value.channel,
      message: value.message,
      eventType: value.eventType,
      status: "PENDING",
    });

    if (value.channel === "EMAIL" && value.to) {
      await adapter.sendEmail({
        to: value.to,
        subject: value.subject,
        html: value.message,
      });
    }

    notification.status = "SENT";
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

router.get("/", authMiddleware, tenantMiddleware, permissionMiddleware("report.view"), async (req, res, next) => {
  try {
    const notifications = await Notification.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
