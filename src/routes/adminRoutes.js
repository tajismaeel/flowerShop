const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { requireAuth, authorize } = require("../middlewares/auth.middleware");
const adminValidate = require("../validations/admin.validate");

//Get
router.get(
  "/role-requests",
  requireAuth,
  authorize("admin"),
  adminValidate.validateGetAllUsers,
  adminController.getRoleRequests,
);

router.get(
  "/user/:userId",
  requireAuth,
  authorize("admin"),
  adminValidate.validateUserIdParam,
  adminController.getUserById,
);

router.get(
  "/users",
  requireAuth,
  authorize("admin"),
  adminValidate.validateGetAllUsers,
  adminController.getAllUsers,
);

// Patch
router.patch(
  "/approve-role/:userId",
  requireAuth,
  authorize("admin"),
  adminValidate.validateRoleAction,
  adminController.approveRole,
);

router.patch(
  "/reject-role/:userId",
  requireAuth,
  authorize("admin"),
  adminValidate.validateRoleAction,
  adminController.rejectRole,
);



module.exports = router;
