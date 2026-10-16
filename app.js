require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const helmet = require("helmet");

const { apiLimiter } = require("./src/middlewares/limiter.js");
const createAdminUser = require("./src/scripts/creatAdmin");
const errormiddleware=require("./src/middlewares/errorMiddleware.js");


const app = express();


//helmet for security
app.use(helmet());
//parsing
app.use(express.json());

//app.use(cookies());
// rate limit
app.use(apiLimiter);

//routes
app.use("/api/v1/auth", require("./src/routes/auth.routes.js"));
app.use("/api/v1/users", require("./src/routes/userRoutes.js"));
app.use("/api/v1/admin", require("./src/routes/adminRoutes.js"));
app.use("/api/v1/products", require("./src/routes/productRoutes.js"));
app.use("/api/v1/categories", require("./src/routes/categoryRoutes.js"));
app.use("/api/v1/reviews", require("./src/routes/reviewRoutes.js"));
app.use("/api/v1/cart", require("./src/routes/cartRoutes.js"));
app.use("/api/v1/orders", require("./src/routes/orderRoutes.js"));

app.use(errormiddleware);

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

app.get("/test", (req, res) => {
  res.send("Hello World");
});
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connect with database done");
    createAdminUser();


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
  });
