const productService = require("../services/productService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

class ProductController {
  // 1. جلب كل المنتجات (مع الترقيم، البحث، والفلترة)
  getAllProducts = asyncHandler(async (req, res) => {
    // نمرر req.query بالكامل (تحتوي على page, limit, search, sort، أو أي فلتر آخر مثل status)
    const result = await productService.getAll(req.query);

    return res
      .status(200)
      .json(success(result, "Products retrieved successfully"));
  });

  // 2. جلب المنتجات حسب القسم (مع دعم الترقيم والبحث داخل القسم أيضاً)
  getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryParam } = req.params;

    // نمرر معرف القسم، ونمرر req.query لدعم الترقيم والبحث داخل هذا القسم المحدد
    const result = await productService.getByCategory(categoryParam, req.query);

    return res
      .status(200)
      .json(success(result, "Products retrieved successfully"));
  });

  // 3. جلب منتج معين بواسطة المُعرف (ID)
  getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    return res
      .status(200)
      .json(success({ product }, "Product retrieved successfully"));
  });

  /* 4. إنشاء منتج جديد
  createProduct = asyncHandler(async (req, res) => {
    // نربط المنتج بالمستخدم الحالي الذي قام بتسجيل الدخول (البائع)
    const productData = { ...req.body, sellerId: req.user.id };
    const newProduct = await productService.create(productData);

    return res
      .status(201)
      .json(success({ product: newProduct }, "Product created successfully"));
  });*/

createProduct = asyncHandler(async (req, res) => {
  // نمرر البيانات الخام وتوكن المستخدم الحالي إلى الـ Service
  const newProduct = await productService.create(req.body, req.user);
  return res.status(201).json(success({ product: newProduct }, "Product created successfully"));
});

  // 5. تحديث منتج
  updateProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id; // استخراج رقم المستخدم من توكن المصادقة (Auth Middleware)
    const userRole = req.user.role; // استخراج دور المستخدم من توكن المصادقة (Auth Middleware)

    const updatedProduct = await productService.update(
      productId,
      userId,
      userRole,
      req.body,
    );
    return res
      .status(200)
      .json(
        success({ product: updatedProduct }, "Product updated successfully"),
      );
  });

  // 6. حذف منتج
  deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    await productService.delete(productId, userId, userRole);
    return res
      .status(200)
      .json(success(null, "Product deleted successfully"));
  });

  // 7. إضافة منتج للمفضلة
  addToFavorites = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const  {productId}  = req.params;

    const favorites = await productService.addToFavorites(userId, productId);
    return res.status(200).json(success({ favorites }, "Product added to favorites successfully"));
  });

  // 8. إزالة منتج من المفضلة
  removeFromFavorites = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    const favorites = await productService.removeFromFavorites(
      userId,
      productId,
    );
    return res.status(200).json(success({ favorites }, "Product removed from favorites successfully"));
  });

  // 9. جلب قائمة المفضلة للمستخدم
  getMyFavorites = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const favorites = await productService.getFavorites(userId);
    return res.status(200).json(success({ favorites }, "My favorites retrieved successfully"));
  });

}

module.exports = new ProductController();
