const categoryService = require("../services/categoryService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

class CategoryController {
  
  // 1. تعديل دالة جلب كل الأقسام لدعم الترقيم والبحث والفرز
  getAll = asyncHandler(async (req, res) => {
    // تمرير req.query إلى الـ Service واستقبال النتيجة المنظمة
    const result = await categoryService.getAll(req.query);

    return res.status(200).json(success(result, "Categories retrieved successfully"));
  });

  getById = asyncHandler(async (req, res) => {
    const data = await categoryService.getById(req.params.id);

    return res.status(200).json(success(data, "Category retrieved successfully"));
  });

  create = asyncHandler(async (req, res) => {
    const data = await categoryService.create(req.body);

    return res.status(201).json(success(data, "Category created successfully"));
  });

  update = asyncHandler(async (req, res) => {
    const data = await categoryService.update(
      req.params.id,
      req.body
    );

    return res.status(200).json(success(data, "Category updated successfully"));
  });

  delete = asyncHandler(async (req, res) => {
    await categoryService.delete(req.params.id);

    return res.status(200).json(success( null,"Category deleted successfully"));
  });
}

module.exports = new CategoryController();
