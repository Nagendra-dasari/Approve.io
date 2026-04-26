const express = require("express");
const upload = require("../../middlewares/upload.middleware");
const Import = require("../../models/import.model");
const ImportError = require("../../models/importError.model");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const ApiError = require("../../common/errors/ApiError");

const router = express.Router();

router.post(
  "/employees",
  authMiddleware,
  tenantMiddleware,
  permissionMiddleware("employee.assign"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, "File is required");
      }

      // Adapter-first mode: rows are expected in JSON payload for now.
      const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
      const importRecord = await Import.create({
        tenantId: req.tenantId,
        fileName: req.file.originalname,
        totalRows: rows.length,
        createdBy: req.auth.userId,
        status: "PENDING",
      });

      let successRows = 0;
      let failedRows = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row.email || !row.name) {
          failedRows += 1;
          await ImportError.create({
            importId: importRecord._id,
            rowNumber: i + 1,
            reason: "Missing required email/name",
            rawData: row,
          });
        } else {
          successRows += 1;
        }
      }

      importRecord.successRows = successRows;
      importRecord.failedRows = failedRows;
      importRecord.status = "DONE";
      await importRecord.save();

      res.status(201).json(importRecord);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
