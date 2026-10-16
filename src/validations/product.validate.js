const { z } = require("zod");

// قاعدة فحص وتطهير معرفات الـ MongoDB ObjectId لمنع هجمات الـ NoSQL Injection
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid Hexadecimal ObjectId format",
});

const productValidationSchemas = {
  // 1. فحص مخطط إنشاء منتج جديد (Create Product)
  create: z.object({
    body: z
      .object({
        name: z
          .string({ required_error: "Product name is required" })
          .trim()
          .min(2, {
            message: "Product name must be at least 2 characters long",
          }),

        description: z
          .string({ required_error: "Description is required" })
          .trim()
          .min(10, {
            message: "Description must be at least 10 characters long",
          }),

        price: z
          .number({ required_error: "Product price is required" })
          .min(0, { message: "Price cannot be negative" }), // يطابق min: 0 في الموديل

        category: objectIdSchema, // يجب أن يكون معرف القسم نقي وصحيح الهيكلية

        images: z
          .array(
            z.string(),
            // .url({ message: "Each image must be a valid URL string" }),
          )
          .min(1, { message: "At least one product image is required" }), // يطابق حقل الموديل المصفوفة

        finalGrowthImage: z
          .string()
          .url()
          .optional()
          .or(z.string().trim().optional()), // اختياري حسب الموديل

        stock: z
          .number({ required_error: "Stock quantity is required" })
          .int({ message: "Stock must be an integer" })
          .min(0, { message: "Stock cannot be negative" }) // يطابق قيود الموديل
          .default(0),
        seller: objectIdSchema.optional(), // يسمح بإرسال معرف البائع من قبل الأدمن، لكن البائع العادي لا يمكنه إرساله وسيتم تجاهله في الخدمة
      })
      .strict({
        message: "Malicious extra fields detected in product creation body",
      }),
  }),

  // 2. فحص مخطط تحديث منتج (Update Product)
  update: z.object({
    params: z
      .object({
        id: objectIdSchema, // معرف المنتج المطلوب تعديله الممرر في الرابط
      })
      .strict(),
    body: z
      .object({
        name: z.string().trim().min(2).optional(),
        description: z.string().trim().min(10).optional(),
        price: z.number().min(0).optional(),
        category: objectIdSchema.optional(),
        images: z.array(z.string().min(1).optional()),
        finalGrowthImage: z
          .string()
          .url()
          .optional()
          .or(z.string().trim().optional()),
        stock: z.number().int().min(0).optional(),
        seller: objectIdSchema.optional(), // يسمح بتحديث البائع من قبل الأدمن، لكن البائع العادي لا يمكنه تحديث هذا الحقل وسيتم تجاهله في الخدمة
      })
      .strict({
        message: "Malicious extra fields detected during product update",
      }),
  }),

  // 3. فحص المعرف الفردي للحذف أو الجلب (GetById / Delete / GetProductsByCategory)
  byId: z.object({
    params: z
      .object({
        id: objectIdSchema,
      })
      .strict(),
  }),

  // 4. فحص جلب المنتجات حسب القسم (بسبب اختلاف اسم البارامتر في الرابط categoryId)
  byCategory: z.object({
    params: z
      .object({
        categoryParam: objectIdSchema.or(z.string().trim().min(2)),
      })
      .strict(),
    query: z
      .object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      })
      .catchall(z.any()),
  }),

  // 5. فحص العمليات على المفضلة (Favorites Body Validation)
  favoriteAction: z.object({
    params: z
      .object({
        productId: objectIdSchema, // يضمن أن المعرف الممرر في الرابط صحيح ونقي
      })
      .strict({ message: "Extra fields not allowed in favorites action" }),
  }),
  // 6. فحص استعلامات الفلترة والبحث العام للمنتجات (GetAll Query Validation)
  query: z.object({
    query: z
      .object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        search: z.string().trim().optional(),
        sort: z.string().trim().optional(),
        category: objectIdSchema.or(z.string().trim().min(2)).optional(),
      })
      .catchall(z.string().trim().optional()) // يسمح بحقول التصفية الديناميكية الأخرى دون انهيار السيرفر
      .strict({
        message: "Malicious extra fields detected in product query parameters",
      }),
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
  validateCreateProduct: validate(productValidationSchemas.create),
  validateUpdateProduct: validate(productValidationSchemas.update),
  validateProductById: validate(productValidationSchemas.byId),
  validateProductsByCategory: validate(productValidationSchemas.byCategory),
  validateFavoriteAction: validate(productValidationSchemas.favoriteAction),
  validateProductQuery: validate(productValidationSchemas.query),
};
