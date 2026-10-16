const express=require("express");
const router=express.Router();
const {authorize, requireAuth}=require("../middlewares/auth.middleware");
const userController=require("../controllers/userController");
const { validateRequestRole } = require("../validations/user.validate");
//Post 
router.post(
  "/request-role",
  requireAuth,
  authorize("client"),
  validateRequestRole,
  (req, res) => userController.requestRole(req, res)
);

module.exports=router;