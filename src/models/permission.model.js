const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    module: { type: String, required: true },
    action: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", permissionSchema);
