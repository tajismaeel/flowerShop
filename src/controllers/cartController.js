const cartService = require("../services/cartService");

class CartController {
  async addToCart(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const { productId, quantity } = req.body;

      const cart = await cartService.addToCart(
        userId,
        productId,
        quantity
      );

      res.json({ status: "success", data: cart });
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  }

  async updateQuantity(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const { productId, quantity } = req.body;

      const cart = await cartService.updateQuantity(
        userId,
        productId,
        quantity
      );

      res.json({ status: "success", data: cart });
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  }

  async removeFromCart(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const { productId } = req.params;

      const cart = await cartService.removeFromCart(
        userId,
        productId
      );

      res.json({ status: "success", data: cart });
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  }

  async getCart(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const cart = await cartService.getCart(userId);

      res.json({ status: "success", data: cart });
    } catch (error) {
      return res.status(400).json({ status: "error", message: error.message });
    }
  }
}

module.exports = new CartController();
