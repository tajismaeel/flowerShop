const User = require("../models/User");
const AppError = require("../utils/AppError");

class AdminService {

async getRoleRequests(queryString) {
  // 1. أخذ نسخة من الـ queryString وفصل حقل الـ role لكي لا يتداخل مع الـ Plugin
  const queryCopy = { ...queryString };
  const roleFilter = queryCopy.role;
  delete queryCopy.role; // حذف الـ role لمنع الـ Plugin من البحث عنه كـ Role أساسي للمستخدم

  const options = {
    page: queryCopy.page,
    limit: queryCopy.limit,
    sort: queryCopy.sort,
    search: queryCopy.search,
    searchFields: ["firstName", "lastName", "email"]
  };

  // 2. تمرير الاستعلام المصفى للـ Plugin
  const query = User.paginate(queryCopy, options);

  // 3. بناء الفلتر الأساسي للطلبات المعلقة الفعليّة
  const filter = {
    "requistedRoles.0": { $exists: true, $ne: null },
    isDeleted: { $ne: true }
  };

  // 4. إذا أرسل الأدمن دوراً معيناً للبحث عنه (مثال: ?role=driver)
  // نفلتر بحيث نضمن أن هذا الدور موجود ومطلوب داخل مصفوفة الطلبات المعلقة
  if (roleFilter) {
    filter.requistedRoles = roleFilter;
  }

  // 5. حقن الفلتر الصارم والدقيق مباشرة في الاستعلام
  query.find(filter);
  query.select("firstName lastName email requistedRoles");

  // تنفيذ استعلام الصفحة الحالية
  const paginatedResult = await query.execPaginate();

  // 6. حساب إجمالي عدد الطلبات الفعلي بناءً على الفلتر المطبق عبر الـ Aggregation
  const totalRequestsAggregation = await User.aggregate([
    { $match: filter },
    { $project: { numberOfRequests: { $size: "$requistedRoles" } } },
    { $group: { _id: null, totalCount: { $sum: "$numberOfRequests" } } }
  ]);

  const totalRequestsCount = totalRequestsAggregation[0]?.totalCount || 0;

  // تحديث عدادات الترقيم الصفحي بناءً على الإجمالي الحقيقي
  paginatedResult.total = totalRequestsCount;
  paginatedResult.pages = Math.ceil(totalRequestsCount / (parseInt(options.limit, 10) || 5));

  return paginatedResult;
}
  // الموافقة
  async approveRole(userId, role) {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
      throw new AppError("User not found or deleted", 404);
    }
    if (!user.requistedRoles.includes(role)) {
      throw new AppError("Role not requested", 400);
    }

    // إضافة role
    if (!user.role.includes(role)) {
      user.role.push(role);
    }

    // حذف الطلب
    user.requistedRoles = user.requistedRoles.filter((r) => r !== role);

    await user.save();

    return user;
  }

  // رفض الطلب
  async rejectRole(userId, role) {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
      throw new AppError("User not found or deleted", 404);
    }

    if (!user.requistedRoles.includes(role)) {
      throw new AppError("Role not requested", 400);
    }

    // فقط حذف الطلب
    user.requistedRoles = user.requistedRoles.filter((r) => r !== role);

    await user.save();

    return user;
  }

  async getAllUsers(queryString) {
    // 1. تحديد الأدوار المسموح بعرضها في القائمة
    const allowedRoles = ["seller", "driver", "client", "admin"];

    if (queryString.role && !allowedRoles.includes(queryString.role)) {
      throw new AppError("Invalid role filter", 400);
    }

    // 2. بناء فلاتر البحث الخاصة بقاعدة البيانات فقط (بدون page و limit)
    const filter = {};

    // إذا حددنا دوراً معيناً في الرابط (مثلاً ?role=driver) نفلتر على أساسه
    if (queryString.role) {
      filter.role = queryString.role;
    }

    // حل مشكلة الحقل الغائب: ابحث عن أي حساب بشرط ألا تكون قيمة isDeleted تساوي true
    // هذا الشرط الذكي يجلب الحسابات التي قيمتها false والحسابات التي لا تملك الحقل أصلاً
    filter.isDeleted = { $ne: true };

    // 3. دمج الفلتر النظيف داخل الـ queryString قبل إرساله للـ Plugin لكي يقرأ الـ page والـ limit بشكل صحيح
    const finalQuery = {
      ...queryString,
      ...filter,
    };

    const result = await User.paginate(finalQuery, {
      searchFields: ["firstName", "lastName", "email"],
      select: "-password",
    }).execPaginate();

    return result;
  }

  async getUserById(userId) {
    const user = await User.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    }).select("-password");

    if (!user || user.isDeleted) {
      throw new AppError("User has been deleted", 404);
    }

    if (!user) {
      throw new AppError("User not found or has been deleted", 404);
    }

    return user;
  }
  /*
  async deleteUser(userId, currentUserId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isDeleted) {
      throw new AppError("User already deleted", 400);
    }

    if (user.role.includes("admin")) {
      throw new AppError("Cannot delete admin", 400);
    }

    if (user._id.toString() === currentUserId) {
      throw new AppError("You cannot delete yourself", 400);
    }
    //  soft delete
    user.isDeleted = true;

    await user.save();

    return true;
  }*/
}

module.exports = new AdminService();
