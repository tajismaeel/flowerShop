const adminService = require("../services/adminService");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");


class AdminController {
getRoleRequests = asyncHandler(async (req, res) => {

  const data = await adminService.getRoleRequests(req.query);
  
  // التصحيح: تمرير البيانات كمعامل أول، والرسالة كمعامل ثاني لتطابق بقية الدوال وتظهر بشكل سليم
  res.status(200).json(success(data, "Role requests retrieved successfully"));
});

  // الموافقة
  approveRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await adminService.approveRole(userId, role);
    res.status(200).json(success(user, "Role approved"));
  });

  // الرفض
  rejectRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await adminService.rejectRole(userId, role);
    res.status(200).json(success(user, "Role rejected"));
  });

  // عرض كل المستخدمين
  getAllUsers = asyncHandler(async (req, res) => {
    const data = await adminService.getAllUsers(req.query);
    res.status(200).json(success(data, "Users retrieved successfully"));
  });

  // عرض مستخدم محدد
  getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await adminService.getUserById(userId);
    res.status(200).json(success(user, "User retrieved successfully"));
  });
/*
  // حذف مستخدم
  deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    await adminService.deleteUser(userId, currentUserId);
    res.status(200).json(success(null, "User deleted successfully"));
  });*/
}

module.exports = new AdminController();
 