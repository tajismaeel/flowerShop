const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid Product ID format"
});

// مخطط فحص إضافة وتحديث الكميات في السلة
const cartItemActionSchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    quantity: z.number().int().min(1, { message: "Quantity must be at least 1" })
  }).strict() // تفعيل التقييد الصارم لمنع حقن أسعار أو حقول غير مصرح بها
});

// مخطط فحص حذف منتج من السلة (يأتي المعرف في الـ Params)
const removeCartItemSchema = z.object({
  params: z.object({
    productId: objectIdSchema
  })
});

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
  next();
};

module.exports = {
  validateCartItem: validate(cartItemActionSchema),
  validateRemoveItem: validate(removeCartItemSchema)
};