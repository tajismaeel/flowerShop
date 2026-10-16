const Review = require("../models/review");
const Product = require("../models/product");
const AppError = require("../utils/AppError");

class ReviewService {
  async createReview(userId, productId, data) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    const review = await Review.create({
      client: userId,
      product: productId,
      comment: data.comment,
      rating: data.rating,
    });

    return review;
  }

  async updateReview(userId, reviewId, data) {
    const review = await Review.findById(reviewId);

    if (!review) throw new AppError("Review not found", 404);

    if (!review.client || review.client.toString() !== userId.toString()) {
      throw new AppError("Not allowed", 403);
    }

    review.comment = data.comment || review.comment;
    review.rating = data.rating || review.rating;

    await review.save();

    return review;
  }

  async deleteReview(userId, reviewId, isAdmin = false) {
    const review = await Review.findById(reviewId).populate({
      path: "product",
      select: "seller",
    });

    if (!review) throw new AppError("Review not found", 404);

    // التحقق الآمن: التأكد من أن الحقول المطلوبة للمقارنة موجودة أولاً لمنع الـ undefined error
    const sellerId = review.product?.seller;
    const clientId = review.client;
    const productId = review.product?._id || review.product; // fallback في حال لم يكن هناك populate

    if (!isAdmin) {
      // نتحقق ما إذا كان المستخدم الحالي هو صاحب المنتج أو صاحب المراجعة
      const isSeller = sellerId && sellerId.equals(userId);
      const isClient = clientId && clientId.equals(userId);

      if (!isSeller && !isClient) {
        throw new AppError("You are not allowed to delete this review", 403);
      }
    }

    await review.deleteOne();
    if (productId) {
      await Review.calcAverageRatings(productId);
    }

    return true;
  }

  async getProductReviews(productId, queryParams = {}) {
    const filter = { product: productId };

    const options = {
      populate: [
        { path: "client", select: "name email" }, // يفضل جلب الحقول الهامة فقط وتجنب الباسورد
      ],
    };

    // 3. استدعاء محرك الترقيم من الـ Plugin وتمرير الفلتر، وإعدادات الصفحة، وخيارات الـ populate
    const result = await Review.paginate(filter, queryParams, options);

    return result;
  }
}

module.exports = new ReviewService();
