const mongoose = require("mongoose");
const mongoosePaginate = require("../pluging/Plugin");

const reviewSchema = new mongoose.Schema(
  {

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: [true, "Review must belong to a product"],
    },

    comment: {
      type: String,
      required: [true, "Please provide a comment"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },

    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true, // لمعرفة وقت كتابة التعليق أو تعديله
  }
);

// منع المستخدم من وضع أكثر من مراجعة لنفس المنتج 
reviewSchema.index({ product: 1, client: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const Product = mongoose.model("product");

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].avgRating * 10) / 10, // تقريب لأقرب خانة عشرية واحدة
      numReviews: stats[0].nRating,
    });
  } else {
    // في حال تم حذف جميع التقييمات، نعود للقيم الافتراضية
    await Product.findByIdAndUpdate(productId, {
      ratings: 0,
      numReviews: 0,
    });
  }
};

// تشغيل التابع بعد عملية الحفظ والتعديل (save)
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("review", reviewSchema);