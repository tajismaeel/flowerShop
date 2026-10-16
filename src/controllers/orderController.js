const orderService = require("../services/order.service");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

class OrderController {
  // === العميل ===
  create = asyncHandler(async (req, res) => {
    const order = await orderService.createOrderFromLocalCart(
      req.user.id,
      req.body,
    );
    res.status(201).json(success("order created successfully", order));
  });

  pay = asyncHandler(async (req, res) => {
    const order = await orderService.processPayment(
      req.params.id,
      req.user.id,
      req.body,
    );
    res.status(200).json(success("Payment processed successfully", order));
  });

  getHistory = asyncHandler(async (req, res) => {
    const paginatedResult = await orderService.getClientOrderHistory(
      req.user.id,
      req.query,
    );
    res
      .status(200)
      .json(success("Order history retrieved successfully", paginatedResult));
  });

  track = asyncHandler(async (req, res) => {
    const order = await orderService.trackOrder(req.params.id, req.user.id);
    res.status(200).json(success("Order tracked successfully", order));
  });

  cancel = asyncHandler(async (req, res) => {
    const order = await orderService.cancelOrderByClient(
      req.params.id,
      req.user.id,
    );
    res.status(200).json(success("Order cancelled successfully", order));
  });

  // === البائع ===
  getDashboard = asyncHandler(async (req, res) => {
    const paginatedResult = await orderService.getSellerDashboard(
      req.user.id,
      req.query,
    );
    res
      .status(200)
      .json(
        success("Seller dashboard retrieved successfully", paginatedResult),
      );
  });

  acceptOrReject = asyncHandler(async (req, res) => {
    const order = await orderService.handleOrderAcceptance(
      req.params.id,
      req.user.id,
      req.body.action,
    );
    res
      .status(200)
      .json(success(`Order ${req.body.action}ed successfully`, order));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const order = await orderService.updatePreparationStatus(
      req.params.id,
      req.user.id,
      req.body.status,
    );
    res.status(200).json(success("Order status updated successfully", order));
  });

  getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await orderService.getSellerAnalytics(req.user.id);
    const stats = analytics[0] || {
      totalEarnings: 0,
      completedOrdersCount: 0,
    };

    return res.status(200).json({
      status: "success",
      message: "Seller analytics retrieved successfully",
      data: {
        totalEarnings: stats.totalEarnings,
        completedOrdersCount: stats.completedOrdersCount,
      },
    });
  });

  // === السائق ===
  getAvailableOrders = asyncHandler(async (req, res) => {
    const paginatedResult = await orderService.getAvailableOrdersPool(
      req.query,
    );
    res
      .status(200)
      .json(
        success("Available orders retrieved successfully", paginatedResult),
      );
  });

  acceptTrip = asyncHandler(async (req, res) => {
    const order = await orderService.acceptTrip(req.params.id, req.user.id);
    res.status(200).json(success("Trip accepted successfully", order));
  });

  updateLifecycle = asyncHandler(async (req, res) => {
    const order = await orderService.updateDeliveryLifecycle(
      req.params.id,
      req.user.id,
      req.body.status,
    );
    res
      .status(200)
      .json(success("Delivery lifecycle updated successfully", order));
  });
}

module.exports = new OrderController();
