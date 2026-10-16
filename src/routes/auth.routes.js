const express= require("express");
const router = express.Router();
const { requireAuth, authorize } = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller.js");
const {loginLimiter} = require ("../middlewares/limiter.js");
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateRefreshToken
} = require("../validations/auth.validate");

//Get
router.get("/profile", requireAuth, authController.getProfile);

//post
router.post("/register",[validateRegister] ,authController.register);


router.post("/login", loginLimiter, validateLogin, authController.login);

router.post("/logout", [requireAuth],authController.logout);

router.post("/refresh-token", validateRefreshToken, authController.refreshToken);

router.post("/change-password", requireAuth, validateChangePassword, authController.changePassword);

//Delete
router.delete("/delete-account/:id", [requireAuth,authorize("client","admin")], authController.deleteAccount);

module.exports = router;



