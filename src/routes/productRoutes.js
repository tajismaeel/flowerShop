const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { requireAuth, authorize } = require("../middlewares/auth.middleware");
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductById,
  validateProductsByCategory,
  validateFavoriteAction,
  validateProductQuery,
} = require("../validations/product.validate");

/*Get
global router for products 
*/

router.get("/getAllProducts", validateProductQuery, productController.getAllProducts);

router.get(
  "/getProductById/:id",
  validateProductById,
  productController.getProductById,
);

router.get(
  "/getProductsByCategory/:categoryParam",
  validateProductsByCategory,
  productController.getProductsByCategory,
);

// client routes for favorites management (get, add, remove)

router.get(
  "/favorites",
  requireAuth,
  authorize("client"),
  productController.getMyFavorites,
);

router.post(
  "/addToFavorites/:productId",
  requireAuth,
  authorize("client"),
  validateFavoriteAction,
  productController.addToFavorites,
);

router.delete(
  "/removeFromFavorites/:productId",
  requireAuth,
  authorize("client"),
  validateFavoriteAction,
  productController.removeFromFavorites,
);


//routes for seller and admin only

//Post
router.post(
  "/createProduct",
  requireAuth,
  authorize("seller", "admin"),
  validateCreateProduct,
  productController.createProduct,
);
//Put
router.put(
  "/updateProduct/:id",
  requireAuth,
  authorize("seller", "admin"),
  validateUpdateProduct,
  productController.updateProduct,
);

//Delete
router.delete(
  "/deleteProduct/:id",
  requireAuth,
  authorize("seller", "admin"),
  validateProductById,
  productController.deleteProduct,
);

module.exports = router;
