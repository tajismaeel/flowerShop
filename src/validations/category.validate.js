const { z } = require("zod");

// قاعدة فحص وتطهير معرفات الـ MongoDB ObjectId لمنع هجمات الحقن
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid Category ID format" });

const categoryValidationSchemas = {
  // 1. فحص مخطط الإنشاء (Create Category) -> يطابق حقول الموديل تماماً
  create: z.object({
    body: z.object({
      name: z
        .string({ required_error: "Category name is required" })
        .trim()
        .min(2, { message: "Name must be at least 2 characters long" }),
      
      description: z.string().trim().optional(),
      image: z.string().url({ message: "Image must be a valid URL string" }).optional().or(z.string().trim().optional()),
      
      // معرف القسم الأب إن وجد، يجب أن يكون ObjectId صالح ونقي
      parentCategory: objectIdSchema.nullable().optional(),
    }).strict({ message: "Extra or malicious fields detected in body" }) // تفعيل المنع الصارم للحقول الزائدة
  }),

  // 2. فحص مخطط التحديث (Update Category) -> جميع الحقول اختيارية ولكنها تخضع للفحص إن أرسلت
  update: z.object({
    params: z.object({
      id: objectIdSchema // فحص معرف القسم المراد تعديله في الرابط
    }).strict(),
    body: z.object({
      name: z
        .string()
        .trim()
        .min(2, { message: "Name must be at least 2 characters long" })
        .optional(),
      description: z.string().trim().optional(),
      image: z.string().optional(),
      parentCategory: objectIdSchema.nullable().optional(),
    }).strict({ message: "Extra or malicious fields detected in body during update" })
  }),

  // 3. فحص عمليات الجلب بالحذف أو المعرف المفرد (GetById / Delete) -> يفحص الرابط فقط
  byId: z.object({
    params: z.object({
      id: objectIdSchema
    }).strict()
  }),

  // 4. فحص واجهة الجلب العام لدعم الترقيم والبحث الآمن (GetAll Queries)
  query: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      search: z.string().trim().optional(),
      sort: z.string().trim().optional(),
    }).catchall(z.any()) // السماح ببارامترات تصفية فرعية دون تسبب بانهيار السيرفر
  })
};

// البرمجية الوسيطة الديناميكية الموحدة لمعالجة الفحص والتطهير تلقائياً
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
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
  validateCreateCategory: validate(categoryValidationSchemas.create),
  validateUpdateCategory: validate(categoryValidationSchemas.update),
  validateCategoryId: validate(categoryValidationSchemas.byId),
  validateCategoryQuery: validate(categoryValidationSchemas.query)
};