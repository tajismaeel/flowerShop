const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/categoryController");
const { requireAuth, authorize } = require("../middlewares/auth.middleware");
const {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryId,
  validateCategoryQuery,
} = require("../validations/category.validate");

router.get("/get-categories", validateCategoryQuery, categoryController.getAll);

router.get("/get-category/:id", validateCategoryId, categoryController.getById);

router.post(
  "/create-category",
  requireAuth,
  authorize("admin"),
  validateCreateCategory,
  categoryController.create,
);

router.put(
  "/update-category/:id",
  requireAuth,
  authorize("admin"),
  validateUpdateCategory,
  categoryController.update,
);

router.delete(
  "/delete-category/:id",
  requireAuth,
  authorize("admin"),
  validateCategoryId,
  categoryController.delete,
);

module.exports = router;
