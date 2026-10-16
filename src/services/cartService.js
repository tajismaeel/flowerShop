const Cart = require("../models/cart");
const Product = require("../models/product");

class CartService {
  async _recalculateTotalPrice(cart) {
    let total = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        item.price = product.price; // تحديث السعر الحالي للمنتج داخل السلة لضمان عدم التلاعب
        total += item.price * item.quantity;
      }
    }
    cart.totalPrice = total;
  }

  // ➕ Add to cart
  async addToCart(userId, productId, quantity) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    let cart = await Cart.findOne({ client: userId });

    if (!cart) {
      cart = await Cart.create({
        client: userId,
        items: [],
        totalPrice: 0,
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        seller: product.sellerId || product.seller, // Handle both cases
      });
    }
    await this._recalculateTotalPrice(cart);
    await cart.save();
    return cart;
  }

  // ✏️ Update quantity (set value)
  async updateQuantity(userId, productId, quantity) {
    const cart = await Cart.findOne({ client: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = cart.items.find((i) => i.product.toString() === productId);

    if (!item) {
      throw new Error("Item not found in cart");
    }
    item.quantity = quantity;

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await this._recalculateTotalPrice(cart);
    await cart.save();
    return cart;
  }

  // ❌ Remove item
  async removeFromCart(userId, productId) {
    const cart = await Cart.findOne({ client: userId });

    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
    await this._recalculateTotalPrice(cart);
    await cart.save();
    return cart;
  }

  // 👀 Get cart
  async getCart(userId) {
    let cart = await Cart.findOne({ client: userId })
      .populate("items.product")
      .populate("items.seller", "firstName lastName");

    // إذا لم يملك المستخدم سلة بعد، نقوم بإنشائها فوراً لمنع الانهيار بالفرونت إند
    if (!cart) {
      cart = await Cart.create({
        client: userId,
        items: [],
        totalPrice: 0,
      });
    }

    return cart;
  }
}

module.exports = new CartService();
