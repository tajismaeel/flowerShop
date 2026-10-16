const { z } = require("zod");

// 1. مخطط التحقق من طلب ترقية الدور (Request Role Schema)
const requestRoleSchema = z.object({
  body: z.object({
    role: z.enum(["seller", "driver"], {
      errorMap: () => ({ message: "You can only request 'seller' or 'driver' roles" })
    })
  }).strict() // منع إرسال أي حقول إضافية خبيثة في الـ Body لحماية الخادم
});

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
  validateRequestRole: validate(requestRoleSchema)
};