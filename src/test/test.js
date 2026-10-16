const TokenService = require("../utils/token.service");
const token = TokenService.generateAcceccToken({ id: 1, name: "taj", age: 21 });
const decrypt=TokenService.verifyAccessToken(token);

const token2 = TokenService.generateRefreshToken({ id: 10, name: "taj10", age: 21 });
const decrypt0=TokenService.verifyRefreshToken(token);
console.log(token2);