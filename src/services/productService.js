const Product = require("../models/product");
const User = require("../models/User");
const Category = require("../models/category");
const AppError = require("../utils/AppError");

class ProductService {
  async getAll(queryParams = {}) {
    // 1. عمل نسخة مستقلة من المعاملات القادمة من الطلب
    const queryObj = { ...queryParams };

    // 2. حذف حقل الكاتيغوري نهائياً لضمان عدم تمريره لقاعدة البيانات
    delete queryObj.category;

    // 3. إعداد خيارات الـ Plugin (للبحث النصي وربط العلاقات واختيار الحقول)
    const options = {
      searchFields: ["name", "description"], // الحقول المسموح بالبحث النصي فيها عند استخدام ?search=keyword
      populate: "seller", // إذا كنت تريد جلب بيانات البائع مع المنتج تلقائياً
      // select: "name price images stock" // (اختياري) إذا كنت تريد تحديد حقول معينة فقط للاسترجاع
    };

    // 4. تمرير كائن الاستعلام النظيف وخيارات الـ Plugin
    const mongoQuery = Product.paginate(queryObj, options);

    // 5. تنفيذ الترقيم الصفحي وإرجاع النتيجة النهائية
    return await mongoQuery.execPaginate();
  }

  async getById(id) {
    const product = await Product.findById(id).populate("category");

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  async getByCategory(categoryParam, queryParams = {}) {
    let categoryId = categoryParam;

    // 1. التحقق هل المعامل الممرر هو ObjectId أم اسم نصي
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryParam);

    if (!isObjectId) {
      // البحث عن الفئة بواسطة الاسم النصي
      const foundCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryParam}$`, "i") },
      });

      if (!foundCategory) {
        throw new AppError("Category not found", 404);
      }

      categoryId = foundCategory._id;
    }

    // 2. إعداد أرقام الترقيم الصفحي وتطهيرها
    const page = Math.max(1, parseInt(queryParams.page, 10)) || 1;
    const limit = Math.max(1, parseInt(queryParams.limit, 10)) || 5;
    const skip = (page - 1) * limit;

    // 3. بناء الفلتر الأساسي للفئة
    const filter = { category: categoryId };

    // 4. حقن منطق البحث الصارم (Search Logic) يدوياً وبشكل مباشر
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search, "i"); // "i" لتجاهل حالة الأحرف والبحث الجزئي
      filter.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    // 5. بناء استعلام جلب البيانات مع الترتيب والترقيم
    let mongoQuery = Product.find(filter)
      .populate("category")
      .skip(skip)
      .limit(limit);

    // تطبيق الترتيب إذا كان ممرراً (مثل sort=-price)
    if (queryParams.sort) {
      mongoQuery = mongoQuery.sort(queryParams.sort);
    }

    // تنفيذ الاستعلامين لجلب البيانات وحساب الإجمالي الحقيقي
    const [data, total] = await Promise.all([
      mongoQuery.exec(),
      Product.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    // 6. إرجاع النتيجة بنفس التنسيق القياسي المتوقع تماماً
    return {
      total,
      page,
      pages,
      limit,
      isNext: page < pages,
      isPrevious: page > 1,
      data,
    };
  }
  /*
  async create(data) {
    return await Product.create(data);
  }
  // productService.js
  */
  async create(data, currentUser) {
    // 1. تحديد ما إذا كان المستخدم الحالي أدمن أم لا
    const isAdmin = Array.isArray(currentUser.role)
      ? currentUser.role.includes("admin")
      : currentUser.role === "admin";

    if (!isAdmin) {
      // [المنع الصارم]: إذا كان المستخدم بائعاً وقام بإرسال حقل seller في الـ body وكان مختلفاً عن معرفه الحقيقي، نمنعه فوراً
      if (data.seller && data.seller.toString() !== currentUser.id.toString()) {
        throw new AppError(
          "You are not allowed to assign products to another seller account",
          400,
        );
      }

      // إذا لم يرسله (وهو الطبيعي)، نقوم بإسناده تلقائياً
      data.seller = currentUser.id;
    } else {
      // إذا كان أدمن: يجب أن يحدد البائع، ونقوم بآلية الفحص المعتادة
      if (!data.seller) {
        throw new AppError("Seller ID is required for admin creation", 400);
      }

      const sellerExists = await User.findById(data.seller);
      if (!sellerExists || sellerExists.isDeleted) {
        throw new AppError("Invalid or deleted seller account", 400);
      }

      // التحقق من أن الحساب المستهدف يمتلك دور بائع فعلياً وليس عميلاً
      const isTargetSeller = Array.isArray(sellerExists.role)
        ? sellerExists.role.includes("seller")
        : sellerExists.role === "seller";

      if (!isTargetSeller) {
        throw new AppError(
          "The assigned user does not have a seller role",
          400,
        );
      }
    }

    // 2. إنشاء المنتج في قاعدة البيانات بعد اجتياز الفحص الصارم
    return await Product.create(data);
  }
  async update(id, userId, userRole, data) {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }
    const isAdmin = Array.isArray(userRole)
      ? userRole.includes("admin")
      : userRole === "admin";
    if (!isAdmin && product.seller.toString() !== userId.toString()) {
      throw new AppError("you are not allowed to update this product", 403);
    }
    if (!isAdmin) {
      delete data.seller;
      delete data._id;
    }
    // إجراء التحديث الفعلي وحفظ البيانات
    Object.assign(product, data);
    await product.save();

    return product;
  }

  async delete(id, userId, userRole) {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const isAdmin = Array.isArray(userRole)
      ? userRole.includes("admin")
      : userRole === "admin";

    if (!isAdmin && product.seller.toString() !== userId.toString()) {
      throw new AppError("you are not allowed to delete this product", 403);
    }

    await User.updateMany(
      { favoriteProducts: id }, // ابحث عن أي مستخدم لديه هذا المنتج في المفضلة
      { $pull: { favoriteProducts: id } }, // قم بإزالته فوراً
    );

    await product.deleteOne();

    return true;
  }

  async addToFavorites(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    //  تحديث بدون تكرار (addToSet)
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favoriteProducts: productId },
      },
      { new: true },
    ).populate("favoriteProducts");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user.favoriteProducts;
  }

  async removeFromFavorites(userId, productId) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { favoriteProducts: productId },
      },
      { returnDocument: "after" },
    ).populate("favoriteProducts");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user.favoriteProducts;
  }

  async getFavorites(userId) {
    const user = await User.findById(userId).populate("favoriteProducts");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user.favoriteProducts;
  }
}

module.exports = new ProductService();
