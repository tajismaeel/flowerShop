require("dotenv").config();

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class TokenService {
  generateAccessToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: "access",
        jti: crypto.randomBytes(16).toString("hex"),
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10m" },
    );
  }

  generateRefreshToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: "refresh",
        jti: crypto.randomBytes(16).toString("hex"),
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );
  }

  verifyAccessToken(token) {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.type !== "access") throw new Error("Invalid token type");
    return decoded;
  }

  verifyRefreshToken(token) {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if (decoded.type !== "refresh") throw new Error("Invalid token type");
    return decoded;
  }

  hashToken(token) {
    return crypto
      .createHmac("sha256", process.env.TOKEN_HASH_SECRET)
      .update(token)
      .digest("hex");
  }
}

module.exports = new TokenService();
