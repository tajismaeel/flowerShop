const { z } = require("zod");

// قاعدة فحص نقاء الـ MongoDB ObjectId لمنع هجمات الـ NoSQL Injection
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ID format" });

const reviewValidationSchemas = {
  // 1. فحص مخطط إنشاء مراجعة جديدة (Create Review)
  create: z.object({
    params: z
      .object({
        productId: objectIdSchema, // التحقق من المعرف الممرر في الرابط هنا
      })
      .strict({ message: "Extra fields detected in params" }),

    body: z
      .object({
        comment: z
          .string({ required_error: "Comment is required" })
          .trim()
          .min(1, { message: "Comment cannot be empty" })
          .max(500, { message: "Comment cannot exceed 500 characters" }), // يطابق قيود الموديل
        rating: z
          .number({ required_error: "Rating is required" })
          .min(1, { message: "Rating must be at least 1" })
          .max(5, { message: "Rating cannot be more than 5" }), // يطابق قيود الموديل
      })
      .strict({ message: "Extra or malicious fields detected in body" }), // منع Mass Assignment للهجمات
  }),

  // 2. فحص مخطط تحديث مراجعة (Update Review)
  update: z.object({
    params: z
      .object({
        id: objectIdSchema, // فحص معرف المراجعة (reviewId) الممرر في الرابط
      })
      .strict(),
    body: z
      .object({
        comment: z
          .string()
          .trim()
          .min(1, { message: "Comment cannot be empty" })
          .max(500, { message: "Comment cannot exceed 500 characters" })
          .optional(), // اختياري في التحديث
        rating: z.number().min(1).max(5).optional(), // اختياري في التحديث
      })
      .strict({ message: "Extra fields detected during update" }),
  }),

  // 3. فحص معاملات حذف المراجعة (Delete Review)
  delete: z.object({
    params: z
      .object({
        id: objectIdSchema, // يضمن جودة ونقاء المعرف الممرر في مسار الحذف
      })
      .strict(),
  }),

  // 4. فحص جلب مراجعات منتج معين (Get Product Reviews)
  getReviews: z.object({
    params: z
      .object({
        productId: objectIdSchema, // فحص معرف المنتج الممرر في الرابط
      })
      .strict(),
    query: z
      .object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      })
      .catchall(z.any()), // السماح ببارامترات الاستعلام الخاصة بالترقين من الـ Plugin
  }),
};

// البرمجية الوسيطة الديناميكية الموحدة لمعالجة الفحص والتطهير تلقائياً
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      errors: result.error.flatten().fieldErrors,
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
  validateCreateReview: validate(reviewValidationSchemas.create),
  validateUpdateReview: validate(reviewValidationSchemas.update),
  validateDeleteReview: validate(reviewValidationSchemas.delete),
  validateGetProductReviews: validate(reviewValidationSchemas.getReviews),
};
