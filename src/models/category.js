const mongoose = require("mongoose");
const paginatePlugin = require('../pluging/Plugin');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    description: String,

    image: String,

 /*parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },*/
  },
  { timestamps: true },
);

categorySchema.plugin(paginatePlugin);
module.exports = mongoose.model("category", categorySchema);
