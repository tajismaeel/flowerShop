const User = require("../models/User");
const passwordService = require("../utils/passwordService");
const AuthService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const AppError = require("../utils/AppError");

class AuthController {
  // زيادة محاولات تسجيل الدخول الفاشلة وقفل الحساب
  handleFailedLogin = async (user) => {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.isLocked = true;
      const MIN = 30 * 60 * 1000; // 30 دقيقة
      user.lockedUntil = new Date(Date.now() + MIN);
    }
    await user.save();
  };

  // إعادة ضبط محاولات تسجيل الدخول الفاشلة
  resetFailedLoginAttempts = async (user) => {
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockedUntil = null;
    await user.save();
  };

  // new user registration
  register = asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      requistSeller,
      requistDriver,
    } = req.body;

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      throw new AppError("Your email already exists", 400);
    }
    // التحقق من عدم تكرار رقم الهاتف
    const existPhone = await User.findOne({ phone });
    if (existPhone) {
      throw new AppError("Your phone number already exists", 400);
    }

    // تحقق من قوة الباسورد

    passwordService.validatePasswordStrength(password);

    const hashedPassword = await passwordService.hashPassword(password);

    let requistedRoles = [];

    if (requistSeller) {
      requistedRoles.push("seller");
    }
    if (requistDriver) {
      requistedRoles.push("driver");
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: ["client"],
      requistedRoles: requistedRoles,
    });

    return res.status(201).json(success(user, "User registered successfully"));
  });

  // log in
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Failed login", 401);
    }

    if (user.isLocked && user.lockedUntil > Date.now()) {
      throw new AppError("Account is temporarily locked", 403);
    } else if (user.isLocked) {
      // reset بعد انتهاء lock
      await this.resetFailedLoginAttempts(user);
    }

    const verified = await passwordService.verifyPassword(
      password,
      user.password,
    );
    if (!verified) {
      await this.handleFailedLogin(user);
      throw new AppError("Failed login", 404);
    }

    await this.resetFailedLoginAttempts(user);

    const tokens = await AuthService.login(user);

    return res.status(200).json(success(tokens, "Login successful")); 
  });

  // refresh token
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken  = req.headers['refreshtoken'] || req.headers['refresh-token'] || req.headers['refreshtoken'];
    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    const tokens = await AuthService.refresh(refreshToken);
    return res
      .status(200)
      .json(success(tokens, "Token refreshed successfully"));
  });

  // log out
  logout = asyncHandler(async (req, res) => {
    
    const refreshToken  = req.headers['refreshtoken'] || req.headers['refresh-token'] || req.headers['refreshtoken'];
    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    await AuthService.logout(refreshToken);

    return res.status(200).json(success("Logged out successfully"));
  });

  // get profile
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    return res.status(200).json(success({ user }));
  });

  // delete account
deleteAccount = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;     
  const currentUserId = req.user.id;       
  const currentUserRole = req.user.role;   

  await AuthService.deleteUser(targetUserId, currentUserId, currentUserRole);

  return res.status(200).json(success(null, "Account processed and deleted successfully"));
});


  //change password
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError("All fields are required", 400);
    }
    const result = await AuthService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );
    return res
      .status(200)
      .json(success(result, "Password changed successfully"));
  });
}

module.exports = new AuthController();
