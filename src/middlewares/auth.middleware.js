const User = require("../models/User");
const tokenService = require("../services/token.service");

const requireAuth = async (req, res, next) => {
  try {
    // احصل على token من header Authorization
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token)
      return res.status(401).json({ message: "Access token required" });

    let decoded;
    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (err) {
      if (err.message.includes("Expired")) {
        return res.status(401).json({ message: "Access token expired" });
      }
      return res.status(401).json({ message: "Invalid access token" });
    }
    
    const user = await User.findById(decoded.id).lean({ password: 0 });
 
    if(user.isDeleted) {
      return res.status(410).json({ message: "Account has been deleted" });
    }
    
    if (!user)
      return res.status(401).json({ message: "User no longer exists" });

    const sanitizedRoles = Array.isArray(user.role)
      ? user.role
      : user.role
        ? [user.role]
        : ["client"];

    if (user.isLocked)
      return res.status(403).json({ message: "Not authorized" });

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: sanitizedRoles,
    };
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log("User Data from Token:", req.user);

    if (!req.user)
      return res.status(401).json({ message: "Authentication failed" });

    // التحقق مما إذا كان للمستخدم أي دور يطابق الأدوار المسموح بها
    const hasRole = req.user.role.some((userRole) =>
      allowedRoles.includes(userRole),
    );

    if (!hasRole) return res.status(403).json({ message: "Invalid role" });
    next();
  };
};

module.exports = { requireAuth, authorize };
