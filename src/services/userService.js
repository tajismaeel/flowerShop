const User = require("../models/User");
const AppError = require("../utils/AppError");

class UserService {
async requestRole(userId, role) {
    // 1. جلب المستخدم للتحقق الأولي من وجوده ومن أدواه الحالية
    const user = await User.findById(userId);
    if(user.isDeleted) {
      throw new AppError("User has been deleted", 404);
    }
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // 2. منع الطلب إذا كان المستخدم يملك هذا الدور بالفعل
    if (user.role && user.role.includes(role)) {
      throw new AppError("You already have this role", 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { requistedRoles: role } },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    return updatedUser;
  }
}

module.exports = new UserService();