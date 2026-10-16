const userService = require("../services/userService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

class UserController {
  requestRole = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { role } = req.body;

    const user = await userService.requestRole(userId, role);

    return res
      .status(200)
      .json(success(user, "Role request submitted successfully"));
  });
}
module.exports = new UserController();
