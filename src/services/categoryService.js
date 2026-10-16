const Category = require("../models/category");
const Product = require("../models/product");
const User = require("../models/User");
const AppError = require("../utils/AppError");

class CategoryService {
  async getAll(queryParams = {}) {
    return await Category.paginate(queryParams, {
      searchFields: ["name"],
    }).execPaginate();
  }

  async getById(id) {
    const category = await Category.findById(id).populate("parentCategory");

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }

  async create(data) {
    return await Category.create(data);
  }

  async update(id, data) {
    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }
async delete(id) {
    const category = await Category.findById(id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    // أ- جلب معرّفات المنتجات التابعة لهذه الفئة قبل حذفها
    const productsToDelete = await Product.find({ category: id }).select("_id");
    const productIds = productsToDelete.map(prod => prod._id);

    if (productIds.length > 0) {
      // ب- إزالة هذه المنتجات من قوائم المفضلة لجميع المستخدمين بضربة واحدة
      await User.updateMany(
        { favoriteProducts: { $in: productIds } },
        { $pull: { favoriteProducts: { $in: productIds } } }
      );

      // ج- حذف المنتجات نفسها من جدول المنتجات
      await Product.deleteMany({ _id: { $in: productIds } });
    }

    // 3. حذف الفئة نفسها
    await category.deleteOne();
    
    return true;
  }
}

module.exports = new CategoryService();
