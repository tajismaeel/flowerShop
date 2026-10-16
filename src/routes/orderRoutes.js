const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {authorize , requireAuth}= require("../middlewares/auth.middleware");
const {
  validateCreateOrder,
  validateOrderIdParam,
  validateSellerAction,
  validateSellerStatusUpdate,
  validateDriverLifecycleUpdate,
  validateProcessPayment
} = require("../validations/order.validate");

// 1.   client Routes

router.post("/create-order",requireAuth, authorize("client"), validateCreateOrder, orderController.create);
router.get("/history", requireAuth, authorize("client"), orderController.getHistory);
router.post("/:id/pay", requireAuth, authorize("client"), validateOrderIdParam, validateProcessPayment, orderController.pay);
router.get("/:id/track", requireAuth, authorize("client"), validateOrderIdParam, orderController.track);
router.delete("/:id/cancel", requireAuth, authorize("client"), validateOrderIdParam, orderController.cancel);


// 2.Seller Routes

router.get("/seller/dashboard", requireAuth, authorize("seller"), orderController.getDashboard);
router.get("/seller/analytics", requireAuth, authorize("seller"), orderController.getAnalytics);
router.put("/seller/:id/action", requireAuth, authorize("seller", "admin"), validateSellerAction, orderController.acceptOrReject);//accept / regect
router.put("/seller/:id/status", requireAuth, authorize("seller"), validateSellerStatusUpdate, orderController.updateStatus);


// 3.   Driver Routes

router.get("/driver/pool", requireAuth, authorize("driver","admin"), orderController.getAvailableOrders);
router.put("/driver/:id/accept", requireAuth, authorize("driver"), validateOrderIdParam, orderController.acceptTrip);
router.put("/driver/:id/lifecycle", requireAuth, authorize("driver"), validateDriverLifecycleUpdate, orderController.updateLifecycle);

module.exports = router;