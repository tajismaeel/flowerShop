const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const { requireAuth, authorize } = require("../middlewares/auth.middleware");
const { validateCartItem, validateRemoveItem } = require("../validations/cart.validate");

router.get(
  "/get-my-cart", 
  requireAuth, 
  authorize("client"),
  cartController.getCart
);

router.post(
  "/add", 
  requireAuth, 
  authorize("client"),
  validateCartItem, // 
  cartController.addToCart
);


router.patch(
  "/update-quantity", 
  requireAuth, 
  authorize("client"),
  validateCartItem, 
  cartController.updateQuantity
);


router.delete(
  "/remove/:productId",
  requireAuth,
  authorize("client"),
  validateRemoveItem, 
);

module.exports = router;