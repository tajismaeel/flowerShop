const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  country: String,
  city: String,
  street: String,
  postalCode: String,
  isDefault: Boolean,
});

module.exports = mongoose.model("Address", addressSchema);
