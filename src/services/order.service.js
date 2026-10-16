const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/User");
const mongoose = require("mongoose");

const AppError = require("../utils/appError");

class OrderService {
  // === 1. عمليات العميل (Client Services) ===

  async createOrderFromLocalCart(clientId, orderData) {
    const {
      orderId,
      seller,
      shippingAddress,
      items,
      taxPrice = 0,
      shippingPrice = 0,
    } = orderData;

    const Seller = await User.findOne({
      _id: seller,
      isDeleted: { $ne: true },
    });

    if (!Seller || !Seller.role.includes("seller")) {
      throw new AppError(
        "The specified seller does not exist or is not a valid seller",
        400,
      );
    }
    if (!items || items.length === 0) {
      throw new AppError(
        "you can't create an order without adding items to the cart",
        400,
      );
    }

    // 1. جلب بيانات جميع المنتجات من قاعدة البيانات
    const productIds = items.map((item) => item.product);
    const databaseProducts = await Product.find({ _id: { $in: productIds } });

    // 2. تجميع المنتجات في مجموعات بناءً على معرف البائع (Group by Seller)
    const itemsBySeller = {};

    for (const localItem of items) {
      const dbProduct = databaseProducts.find(
        (p) => p._id.toString() === localItem.product.toString(),
      );
      if (!dbProduct) {
        throw new AppError(
          `product ${localItem.product} is no longer available`,
          400,
        );
      }

      const sellerId = dbProduct.seller.toString();
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }

      itemsBySeller[sellerId].push({
        product: dbProduct._id,
        name: dbProduct.name,
        image: dbProduct.image,
        price: dbProduct.price,
        quantity: localItem.quantity,
      });
    }

    const createdOrders = [];

    // 3. إنشاء طلب منفصل لكل بائع في قاعدة البيانات
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      // حساب الأسعار الخاصة بمنتجات هذا البائع فقط
      const itemsPriceTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // تقسيم أسعار الشحن والضرائب بالتساوي أو حسب منطق عملك
      const finalTotalPrice = itemsPriceTotal + taxPrice + shippingPrice;

      const order = new Order({
        orderId,
        client: clientId,
        seller: sellerId, // 👈 كل طلب يربط ببائع محدد بشكل مستقل
        items: sellerItems,
        shippingAddress,
        itemsPrice: Number(itemsPriceTotal.toFixed(2)),
        taxPrice,
        shippingPrice,
        totalPrice: Number(finalTotalPrice.toFixed(2)),
        status: "CREATED",
      });

      const savedOrder = await order.save();
      createdOrders.push(savedOrder.toJSON());
    }

    // نُرجع قائمة بالطلبات التي تم إنشاؤها
    return createdOrders;
  }
  async processPayment(orderId, clientId, paymentData) {
    const order = await Order.findOne({ _id: orderId, client: clientId });
    if (!order) throw new AppError("Order not found", 404);

    // هنا يتم دمج بوابة الدفع (Stripe / PayPal) وحال النجاح يتم التحديث:
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentMethod = paymentData.method; // e.g., 'STRIPE'
    order.paymentResult = { id: paymentData.id, status: paymentData.status };

    return await order.save();
  }

async getClientOrderHistory(clientId, queryString) {
  // نقوم بتمرير الـ filter الخاص بالعميل داخل الـ query الأساسي
  const query = Order.paginate(
    { client: clientId, ...queryString }, 
    { populate: { path: "seller", select: "name" } }
  );
  
  return await query.execPaginate();
}

  async trackOrder(orderId, clientId) {
    const order = await Order.findOne(
      { _id: orderId, client: clientId },
      { status: 1, updatedAt: 1 },
    );
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  async cancelOrderByClient(orderId, clientId) {
    const order = await Order.findOne({ _id: orderId, client: clientId });
    if (!order) throw new AppError("Order not found", 404);

    // يسمح بالإلغاء فقط إذا كانت الحالة CREATED أو CONFIRMED ولم يتم البدء في التجهيز
    if (!["CREATED", "CONFIRMED"].includes(order.status)) {
      throw new AppError(
        "Cannot cancel order, it has already started processing",
        400,
      );
    }

    order.status = "CANCELLED";
    return await order.save();
  }

  // === 2. عمليات البائع (Seller Services) ===

  async getSellerDashboard(sellerId , queryString) {
    const seller = await User.findOne({
      _id: sellerId,
      isDeleted: { $ne: true },
    });
    if (!seller || !seller.role.includes("seller")) {
      throw new AppError(
        "Seller account is suspended, deleted, or not a valid seller",
        400,
      );
    }
    const query = Order.paginate(
      { seller: sellerId, status: "CREATED", ...queryString },
      { populate: { path: "client", select: "name" } },
    );
    return await query.execPaginate();
  }

  async handleOrderAcceptance(orderId, sellerId, action) {
    const seller = await User.findOne({
      _id: sellerId,
      isDeleted: { $ne: true },
    });
    if (!seller || !seller.role.includes("seller")) {
      throw new AppError(
        "Seller account is suspended, deleted, or not a valid seller",
        400,
      );
    }
    const order = await Order.findOne({ _id: orderId, seller: sellerId });
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== "CREATED")
      throw new AppError("Order has already been processed", 400);

    if (action === "ACCEPT") {
      order.status = "CONFIRMED";
    } else if (action === "REJECT") {
      order.status = "CANCELLED";
    } else {
      throw new AppError("Unsupported action", 400);
    }

    return await order.save();
  }

  async updatePreparationStatus(orderId, sellerId, nextStatus) {
    const seller = await User.findOne({
      _id: sellerId,
      isDeleted: { $ne: true },
    });
    if (!seller || !seller.role.includes("seller")) {
      throw new AppError(
        "Seller account is suspended, deleted, or not a valid seller",
        400,
      );
    }
    const order = await Order.findOne({ _id: orderId, seller: sellerId });
    if (!order) throw new AppError("Order not found", 404);

    const validTransitions = {
      CONFIRMED: "PREPARING",
      PREPARING: "READY",
    };

    if (validTransitions[order.status] !== nextStatus) {
      throw new AppError(
        `Invalid transition from ${order.status} to ${nextStatus}`,
        400,
      );
    }

    order.status = nextStatus;
    return await order.save();
  }

  async getSellerAnalytics(sellerId) {
    const seller = await User.findOne({
      _id: sellerId,
      isDeleted: { $ne: true },
    });
    if (!seller || !seller.role.includes("seller")) {
      throw new AppError(
        "Seller account is suspended, deleted, or not a valid seller",
        400,
      );
    }
    return await Order.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          status: "DELIVERED",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalPrice" },
          completedOrdersCount: { $sum: 1 },
        },
      },
    ]);
  }

  // === 3. عمليات السائق (Driver Services) ===

  async getAvailableOrdersPool(queryString) {
    const query = Order.paginate(
      { status: "READY", driver: { $exists: false }, ...queryString },
      {
        // دمج منطق الـ populate واختيار الحقول من الـ Plugin مباشرة
        populate: [
          {
            path: "seller",
            select: "name shippingAddress isDeleted",
            match: { isDeleted: { $ne: true } },
          },
          { path: "client", select: "name" },
        ],
      },
    );

    const result = await query.execPaginate();

    // تصفية البائعين المحذوفين من مصفوفة الـ data الراجعة
    result.data = result.data.filter((order) => order.seller !== null);
    return result;
  }
  async acceptTrip(orderId, driverId) {
    // 1. التحقق من أن السائق موجود وفعال وليس محذوفاً
    const dbDriver = await User.findOne({
      _id: driverId,
      isDeleted: { $ne: true },
    });
    if (!dbDriver || !dbDriver.role.includes("driver")) {
      throw new AppError("Driver account is suspended or deleted", 400);
    }

    // 2. تحديث الطلب بأمان في خطوة واحدة (Atomic Operation) لحمايته من التزامن
    const order = await Order.findOneAndUpdate(
      { _id: orderId, status: "READY", driver: { $exists: false } },
      {
        driver: driverId,
        status: "ASSIGNED",
        driverAcceptedAt: new Date(),
      },
      { new: true }, // لإعادة المستند بعد التحديث
    );

    if (!order) {
      throw new AppError(
        "Order is not available for assignment or accepted by another driver",
        400,
      );
    }

    // نُرجع الـ order مباشرة دون الحاجة لـ order.save() مرة أخرى
    return order;
  }

  async updateDeliveryLifecycle(orderId, driverId, currentStatus) {
    const dbDriver = await User.findOne({
      _id: driverId,
      isDeleted: { $ne: true },
    });

    if (!dbDriver || !dbDriver.role.includes("driver")) {
      throw new AppError("Driver account is suspended or deleted", 400);
    }

    const order = await Order.findOne({ _id: orderId, driver: driverId });

    if (!order)
      throw new AppError("The order is not assigned to this driver", 404);

    if (currentStatus === "PICKED_UP") {
      if (order.status !== "ASSIGNED")
        throw new AppError(
          " An order that has not been approved first cannot be received",
          400,
        );
      order.status = "PICKED_UP";
    } else if (currentStatus === "DELIVERED") {
      if (order.status !== "PICKED_UP")
        throw new AppError(
          " An order that has not been picked up first cannot be delivered",
          400,
        );
      order.status = "DELIVERED";
    } else {
      throw new AppError("Unknown delivery status", 400);
    }

    return await order.save();
  }
}

module.exports = new OrderService();
