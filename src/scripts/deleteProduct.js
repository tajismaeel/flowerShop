// scripts/deleteProduct.js
const mongoose = require("mongoose");
const Category = require("../models/category");
const Product = require("../models/product");
require("dotenv").config(); // لشحن رابط قاعدة البيانات من ملف .env

async function cleanOrphanProducts() {
  try {
    // 1. الاتصال بقاعدة البيانات (تأكد من مطابقة اسم المتغير لديك في ملف .env)
    await mongoose.connect(process.env.MONGO_URL || process.env.DATABASE_URL);
    console.log("Connected to MongoDB successfully.");

    // 2. جلب معرفات جميع الفئات النشطة حالياً
    const activeCategories = await Category.find().distinct("_id");

    // 3. حذف أي منتج لا تنتمي فئته إلى الفئات النشطة
    const deleteResult = await Product.deleteMany({
      category: { $nin: activeCategories }
    });

    console.log(` Done! ${deleteResult.deletedCount} orphan products deleted successfully.`);
  } catch (error) {
    console.error(" Error running script:", error);
  } finally {
    // 4. إغلاق الاتصال بأمان بعد انتهاء العملية
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

cleanOrphanProducts();