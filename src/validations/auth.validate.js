const { header } = require("express-validator");
const { z } = require("zod");

// قاعدة فحص نقاء الـ MongoDB ObjectId لمنع هجمات الحقن في الروابط والمعاملات
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "invalid object ID" });

const authValidationSchemas = {
  // 1. فحص مخطط التسجيل الجديد (Register) -> يطابق موديل المستخدم وحقوله الصالحة فقط
  register: z.object({
    body: z.object({
      firstName: z
        .string({ required_error: " first name is required" })
        .trim()
        .min(2, { message: "first name must be at least 2 characters long" })
        .max(30, { message: "first name cannot exceed 30 characters" }),
      
      lastName: z
        .string({ required_error: "last name is required" })
        .trim()
        .min(2, { message: "last name must be at least 2 characters long" })
        .max(30, { message: "last name cannot exceed 30 characters" }),
      
      email: z
        .string({ required_error: "email is required" })
        .trim()
        .email({ message: "please enter a valid email address" })
        .transform((val) => val.toLowerCase()),
      
      phone: z
        .string({ required_error: "phone number is required" })
        .trim()
        .regex(/^\+?[1-9]\d{7,14}$/, { message: "invalid phone number, must match international format" }),
      
      password: z
        .string({ required_error: "password is required" })
        .min(8, { message: "password must be at least 8 characters long" }),
        
      requistSeller: z.boolean().optional(),
      requistDriver: z.boolean().optional(),
    }).strict({ message: "unauthorized field found in registration request" }) // حظر إرسال حقل role هنا لمنع تزوير الحسابات
  }),

  // 2. فحص مخطط تسجيل الدخول (Login)
  login: z.object({
    body: z.object({
      email: z
        .string({ required_error: "email is required" })
        .trim()
        .email({ message: "please enter a valid email address" })
        .transform((val) => val.toLowerCase()),
      
      password: z
        .string({ required_error: "password is required" })
    }).strict({ message: "unauthorized field found in login request" })
  }),

  // 3. فحص مخطط تغيير كلمة المرور (Change Password)
  changePassword: z.object({
    body: z.object({
      oldPassword: z.string({ required_error: "old password is required" }),
      newPassword: z
        .string({ required_error: "new password is required" })
        .min(8, { message: "new password must be at least 8 characters long" })
    }).strict({ message: "unauthorized field found in change password request" })
  }),

  // 4. فحص الـ Refresh Token (لو كان يرسل في الـ Body)
  refreshToken: z.object({
    headers: z.object({
      refreshtoken: z.string({ required_error: "refresh token is required" })
    }).passthrough()
  })
};

// البرمجية الوسيطة الديناميكية الموحدة لمعالجة الفحص والتطهير تلقائياً
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers
  });

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      errors: result.error.flatten().fieldErrors
    });
  }
// التحديث الآمن: نقوم بالاستبدال فقط إذا كانت البيانات موجودة ومطهرة من Zod لمنع حقول الـ undefined
  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.params !== undefined) req.params = result.data.params;
  if (result.data.query !== undefined) req.query = result.data.query;
  if (result.data.headers !== undefined) req.headers = result.data.headers;
  next();
};

module.exports = {
  validateRegister: validate(authValidationSchemas.register),
  validateLogin: validate(authValidationSchemas.login),
  validateChangePassword: validate(authValidationSchemas.changePassword),
  validateRefreshToken: validate(authValidationSchemas.refreshToken)
};