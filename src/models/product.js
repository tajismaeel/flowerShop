const mongoose = require("mongoose");
const paginatePlugin = require('../pluging/Plugin');

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, " Product name is required "],
    },

    description: {
      type: String,
      required: [true, " description name is required "],
    },

    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      required: [true, " Product price is required "],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: [true, "Please provide a category"],
    },

    // صور المنتج (البذور)
    images: [{ type: String, required: true }],

    // صورة استعراضية للنبات المكتمل (الميزة التي طلبها العميل في النص)
    finalGrowthImage: { type: String },

    stock: {
      type: Number,
      required: [true, "Please provide stock quantity"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

productSchema.plugin(paginatePlugin);

module.exports = mongoose.model("product", productSchema);
