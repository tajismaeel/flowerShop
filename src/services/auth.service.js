const TokenService = require("../services/token.service");
const RefreshToken = require("../models/Token");
const passwordService = require("../utils/passwordService");
const User = require("../models/User");
const AppError = require("../utils/AppError");

class AuthService {
  
  async login(user) {
    const payload = { id: user._id, email: user.email, role: user.role };
    const accessToken = TokenService.generateAccessToken(payload);
    const refreshToken = TokenService.generateRefreshToken(payload);

    const hashed = TokenService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام
   
    // مسح كافة الجلسات القديمة (فرض جهاز واحد)
    await RefreshToken.deleteMany({ userId: user._id });
    
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashed,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken) {
    const payload = TokenService.verifyRefreshToken(refreshToken);

    const hashed = TokenService.hashToken(refreshToken);

    const tokenDoc = await RefreshToken.findOne({ tokenHash: hashed });

    // atomic delete + rotation

    if (!tokenDoc) {
      await RefreshToken.deleteMany({ userId: payload.id });

      throw new AppError("Session compromised, please login again", 400);
    }

    if (tokenDoc.userId.toString() !== payload.id) {
      throw new AppError("Invalid session", 400);
    }
    //  تحقق من الانتهاء
    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ tokenHash: hashed });
      throw new AppError("Session expired", 400);
    }
    // (rotation)
    await RefreshToken.deleteOne({ tokenHash: hashed });

    const newPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    const newAccess = TokenService.generateAccessToken(newPayload);
    const newRefresh = TokenService.generateRefreshToken(newPayload);

    const newHashed = TokenService.hashToken(newRefresh);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: payload.id,
      tokenHash: newHashed,
      expiresAt,
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

  async logout(refreshToken) {
    const hashed = TokenService.hashToken(refreshToken);
    
    if(!hashed){
      throw new AppError("refresh token not found", 404);
      
    }
    await RefreshToken.deleteOne({ tokenHash: hashed });
  }

  async deleteUser(userId, currentUserId, currentUserRole) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isDeleted) {
    throw new AppError("User already deleted", 400);
  }

  const isOwner = user._id.toString() === currentUserId;
  const isAdmin = currentUserRole && currentUserRole.includes("admin");

  // 2. الشرط الأول: منع الأدمن من حذف نفسه
  if (isAdmin && isOwner) {
    throw new AppError("Admins cannot delete themselves from the system", 400);
  }


  if (!isOwner && !isAdmin) {
    throw new AppError("You do not have permission to delete this account", 403);
  }

  // تنفيذ الحذف الناعم (Soft Delete)
  user.isDeleted = true;
  await user.save();

  await RefreshToken.deleteMany({ userId: userId }); 

  return true;
}

  async changePassword(userId, oldPassword, newPassword) {
    // 1. جلب المستخدم
    const user = await User.findById(userId).select("+password"); // تأكد من جلب حقل الباسورد إذا كان مخفياً في الموديل
    if (!user) throw new AppError("User not found", 404);

    // 2. التحقق من صحة كلمة المرور القديمة
    const isMatch = await passwordService.verifyPassword(
      oldPassword,
      user.password,
    );
    if (!isMatch) throw new AppError("Current password is incorrect", 400);

    // 3. التحقق من أن الجديدة ليست كـ القديمة (أمنياً)
    const isSameAsOld = await passwordService.verifyPassword(
      newPassword,
      user.password,
    );
    if (isSameAsOld) {
      throw new AppError("New password cannot be the same as the old one", 400);
    }

    // 4. التحقق من القوة وتشفير الجديدة
    passwordService.validatePasswordStrength(newPassword);
    user.password = await passwordService.hashPassword(newPassword);

    // 5. حفظ البيانات أولاً
    await user.save();

    // 6. إنهاء جميع الجلسات (Logout from all devices)
    await RefreshToken.deleteMany({ userId: user._id });

    return {
      message:
        "Password changed successfully. All sessions have been revoked. Please log in again.",
    };
  }
}
module.exports = new AuthService();
