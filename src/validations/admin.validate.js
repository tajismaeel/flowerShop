const { z } = require("zod");

// ميزة فحص الـ ObjectId الخاص بـ MongoDB للتأكد من أن المعرفات صالحة
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ID format"
});

// 1. مخطط فحص عمليات الأدوار (Approve / Reject Role)
const roleActionSchema = z.object({
  params: z.object({
    userId: objectIdSchema
  }),
  body: z.object({
    role: z.enum(["seller", "driver"], {
      errorMap: () => ({ message: "Role must be either 'seller' or 'driver'" })
    })
  }).strict() // منع أي حقول إضافية غير معرفة في المخطط
});

// 2. مخطط فحص جلب كل المستخدمين مع التصفية (Get All Users Query)
const getAllUsersSchema = z.object({
  query: z.object({
    role: z.enum(["seller", "driver", "client"]).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default("1"), // وضع قيمة افتراضية آمنة
    limit: z.string().regex(/^\d+$/).transform(Number).default("10"), // وضع قيمة افتراضية آمنة
    search: z.string().optional()
  }).strict() 
});

// 3. مخطط فحص العمليات التي تعتمد على المعرّف فقط (GetUserById / DeleteUser)
const userIdParamSchema = z.object({
  params: z.object({
    userId: objectIdSchema
  }).strict()
});

// --- البرمجية الوسيطة الديناميكية الموحدة (Generic Validation Middleware) ---
// هذه الدالة تغنيك عن تكرار الكود وتضمن تصفية البيانات (Strip) من أي حقول خبيثة
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    params: req.params,
    body: req.body,
    query: req.query
  });

  if (!result.success) {
    // إرجاع تفاصيل الأخطاء كاملة بشكل منظم ومفهوم للمطورين
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
  validateRoleAction: validate(roleActionSchema),
  validateGetAllUsers: validate(getAllUsersSchema),
  validateUserIdParam: validate(userIdParamSchema)
};