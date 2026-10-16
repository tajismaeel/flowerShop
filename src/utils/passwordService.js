const bcrypt = require("bcryptjs");

class PasswordService {
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
  //to compare the entered password with the one found in the DB
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
  //Password strength test
  validatePasswordStrength(password) {
    if (typeof password !== "string") {
      throw new Error("Password must be a string");
    }

    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password); // A - Z
    const hasLowerCase = /[a-z]/.test(password); // a - z
    const hasNumbers = /\d/.test(password); // 1,2,3,...
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password); //

    const errors = [];

    if (password.length < minLength)
      errors.push("must be at least 8 characters long");
    if (!hasUpperCase) errors.push("must contain uppercase letters");
    if (!hasLowerCase) errors.push("must contain lowercase letters");
    if (!hasNumbers) errors.push("must contain numbers");
    if (!hasSpecialChar) errors.push("must contain special characters");

    if (errors.length > 0) {
      throw new Error(`Password ${errors.join(", ")}`);
    }

    return true;
  }
}

module.exports = new PasswordService();
