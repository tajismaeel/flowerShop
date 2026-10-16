const mongoose = require("mongoose");
const paginatePlugin = require('../pluging/Plugin');

const orderItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  image: String,
  price: Number,
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
  },
});

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    totalPrice: { type: Number, required: true },

    itemsPrice: Number,

    taxPrice: Number,

    shippingPrice: Number,


    paymentMethod: String,

    paymentResult: Object,


    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    

    driverAcceptedAt: Date,

    status: {
      type: String,
      enum: [
        "CREATED", // انشاء الطلب
        "CONFIRMED", //قبول البائع للطبل
        "PREPARING", // تجهيز الطلب
        "READY", // جاهز للتسليم
        "ASSIGNED", // تم تعيين سائق للتوصيل
        "PICKED_UP", // تم استلام الطلب من قبل السائق
        "DELIVERED", // تم توصيل الطلب للعميل
        "CANCELLED", // تم إلغاء الطلب
      ],
      default: "CREATED",
    },
  },{
  timestamps: true,
  // 👈 هذا الجزء يضمن تحويل الـ _id إلى id نصي نظيف تلقائيًا عند إرساله كـ JSON
  toJSON: { 
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id; // إتاحة حقل id
      // إذا كنت تريد إظهار الـ _id الأصلي أيضًا احذف السطر التالي، أما إذا كنت تريد استبداله فاتركه
      // delete ret.__v; 
      return ret;
    }
  },
  toObject: { virtuals: true }
});

orderSchema.plugin(paginatePlugin);
module.exports = mongoose.model("order", orderSchema);
