const rateLimiter = require ("express-rate-limit");

const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max :50,
    message: {
        error : "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
})

const loginLimiter = rateLimiter({
  windowMs: 10* 60 * 1000,
  max: 6,
  message: {
    error: "Too many login attempts. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = {apiLimiter , loginLimiter};