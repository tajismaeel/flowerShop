const mongoose = require("mongoose");
const paginatePlugin = require("../pluging/Plugin");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 30,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: 2,
      maxlength: 30,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid Email"],
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^\+?[1-9]\d{7,14}$/, "Invalid phone number"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    //؟
    role: {
      type: [String],
      enum: ["client", "seller", "admin", "driver"],
      default: ["client"],
      index: true,
    },

    requistedRoles: {
      type: [String],
      enum: ["seller", "driver"],
      default: [],
    },

    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],

    favoriteProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    //if user log in or not
    isVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastLogin: Date,
    passwordChangedAt: Date,

    //locked after many failed aatempts
    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedUntil: Date,

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(paginatePlugin);

module.exports = mongoose.model("User", userSchema);
