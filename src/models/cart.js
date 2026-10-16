const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  seller :{
    type : mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  price: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, //only one cart for client
    },

    items: [cartItemSchema],

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports= mongoose.model("cart", cartSchema);
