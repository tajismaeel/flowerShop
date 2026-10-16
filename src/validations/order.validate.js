const { z } = require("zod");

// قاعدة فحص ونقاء الـ MongoDB ObjectId لمنع هجمات الحقن في الروابط والمعاملات
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "invalid object ID" });

const orderValidationSchemas = {
  // 1. فحص مخطط إنشاء الطلب من السلة المحلية (Create Order)
  createOrder: z.object({
    body: z.object({
      seller: z
        .string({ required_error: "seller ID is required" })
        .regex(/^[0-9a-fA-F]{24}$/, { message: "invalid seller ID format" }),

      shippingAddress: z.object({
        street: z.string({ required_error: "street address is required" }).trim().min(1),
        city: z.string({ required_error: "city is required" }).trim().min(1),
        state: z.string().trim().optional(),
        zipCode: z.string().trim().optional(),
        country: z.string({ required_error: "country is required" }).trim().min(1),
      }, { required_error: "shipping address is required" }),

      items: z
        .array(
          z.object({
            product: z
              .string({ required_error: "product ID is required" })
              .regex(/^[0-9a-fA-F]{24}$/, { message: "invalid product ID format" }),
            quantity: z
              .number({ required_error: "quantity is required" })
              .int({ message: "quantity must be an integer" })
              .positive({ message: "quantity must be greater than 0" }),
          })
        )
        .min(1, { message: "you can't create an order without adding items to the cart" }),

      taxPrice: z
        .number()
        .nonnegative({ message: "tax price cannot be negative" })
        .optional()
        .default(0),

      shippingPrice: z
        .number()
        .nonnegative({ message: "shipping price cannot be negative" })
        .optional()
        .default(0),
    }).strict({ message: "unauthorized field found in create order request" })
  }),

  // 2. فحص المسارات التي تعتمد على معرف الطلب في الرابط مثل التتبع، الإلغاء، القبول
  orderIdParam: z.object({
    params: z.object({
      id: objectIdSchema
    })
  }),

  // 3. فحص عملية الدفع (المخطط المفقود الذي كان يسبب انهيار السيرفر)
  processPayment: z.object({
    params: z.object({
      id: objectIdSchema
    }),
    body: z.object({
      method: z.enum(["STRIPE", "PAYPAL"], { 
        errorMap: () => ({ message: "Payment method must be either STRIPE or PAYPAL" }) 
      }),
      id: z.string({ required_error: "Payment transaction ID is required" }).trim().min(1),
      status: z.string({ required_error: "Payment status is required" }).trim().min(1)
    }).strict({ message: "unauthorized field found in payment request" })
  }),

  // 4. فحص عملية اتخاذ الإجراء من البائع (قبول أو رفض)
  sellerAction: z.object({
    params: z.object({
      id: objectIdSchema
    }),
    body: z.object({
      action: z.enum(["ACCEPT", "REJECT"], { 
        errorMap: () => ({ message: "action must be either ACCEPT or REJECT" }) 
      })
    }).strict({ message: "unauthorized field found in seller action request" })
  }),

  // 5. فحص تحديث حالة تجهيز الطلب من البائع
  sellerStatusUpdate: z.object({
    params: z.object({
      id: objectIdSchema
    }),
    body: z.object({
      status: z.enum(["PREPARING", "READY"], { 
        errorMap: () => ({ message: "status must be either PREPARING or READY" }) 
      })
    }).strict({ message: "unauthorized field found in status update request" })
  }),

  // 6. فحص تحديث السائق لحالة دورة حياة التوصيل
  driverLifecycleUpdate: z.object({
    params: z.object({
      id: objectIdSchema
    }),
    body: z.object({
      status: z.enum(["PICKED_UP", "DELIVERED"], { 
        errorMap: () => ({ message: "status must be either PICKED_UP or DELIVERED" }) 
      })
    }).strict({ message: "unauthorized field found in lifecycle update request" })
  })
};

// البرمجية الوسيطة الديناميكية الموحدة المحدثة بشكل آمن
const validate = (schema) => (req, res, next) => {
  if (!schema) {
    return res.status(500).json({
      status: "error",
      message: "Validation schema is missing for this route."
    });
  }

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

  // نقوم بالتحديث المباشر للمفاتيح المعرفة فقط لحماية البقية من الـ undefined
  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.params !== undefined) req.params = result.data.params;
  if (result.data.query !== undefined) req.query = result.data.query;
  if (result.data.headers !== undefined) req.headers = result.data.headers;

  next();
};

module.exports = {
  validateCreateOrder: validate(orderValidationSchemas.createOrder),
  validateOrderIdParam: validate(orderValidationSchemas.orderIdParam),
  validateProcessPayment: validate(orderValidationSchemas.processPayment), // 👈 الآن يمرر المخطط الصحيح
  validateSellerAction: validate(orderValidationSchemas.sellerAction),
  validateSellerStatusUpdate: validate(orderValidationSchemas.sellerStatusUpdate),
  validateDriverLifecycleUpdate: validate(orderValidationSchemas.driverLifecycleUpdate)
};