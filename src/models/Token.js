const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  device: {
    type: String,
    platform: String,      // ios / android / web
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// TTL index (يحذف تلقائي بعد انتهاء الصلاحية)
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Token", tokenSchema);
