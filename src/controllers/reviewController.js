const reviewService = require("../services/reviewService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

class ReviewController {
  createReview = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const review = await reviewService.createReview(
      req.user.id,
      productId,
      req.body,
      );


    res.status(201).json(success({ review }, "Review created successfully"));
  });

  updateReview = asyncHandler(async (req, res) => {
    const review = await reviewService.updateReview(
      req.user.id,
      req.params.id,
      req.body,
    );
    return res.status(200).json(success({ review }, "Review updated successfully"));
  });

  deleteReview = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role.includes("admin");

    await reviewService.deleteReview(req.user.id, req.params.id, isAdmin);

    return res.status(200).json(success(null, "Review deleted successfully"));
  });

  getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const reviewsData = await reviewService.getProductReviews(
      productId,
      req.query,
    );

    return res.status(200).json(success(reviewsData, "Reviews retrieved successfully"));
  });
}

module.exports = new ReviewController();
