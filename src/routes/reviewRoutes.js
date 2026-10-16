const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const { requireAuth, authorize } = require("../middlewares/auth.middleware");
const {
  validateCreateReview,
  validateUpdateReview,
  validateDeleteReview,
  validateGetProductReviews,
} = require("../validations/review.validate");

//Get
router.get(
  "/get-Product-Reviews/:productId",
  validateGetProductReviews,
  reviewController.getProductReviews,
);

//Post
router.post(
  "/create/:productId",
  requireAuth,
  authorize("client"),
  validateCreateReview,
  reviewController.createReview,
);

//Put
router.put(
  "/update/:id",
  requireAuth,
  authorize("client"),
  validateUpdateReview,
  reviewController.updateReview,
);

//Delete
router.delete(
  "/delete/:id",
  requireAuth,
  authorize("client", "admin"),
  validateDeleteReview,
  reviewController.deleteReview,
);

module.exports = router;
