const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5001;
dotenv.config();
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const i18nextMiddleware = require("i18next-http-middleware");
const i18next = require("./shared/i18next/i18nextConfig.js");
const { errorHandler } = require("./shared/handlers/error/errorHandler.js");
const {
  successHandler,
} = require("./shared/handlers/success/successHandlers.js");

app.set("trust proxy", 1);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};

app.use(successHandler);

const userRouter = require("./routes/userRoute.js");
const authRouter = require("./routes/authRoute.js");
const stockRouter = require("./routes/stockRoute.js");
const currencyRouter = require("./routes/currencyRoute.js");
const goldRouter = require("./routes/goldRoute.js");
const portfolioRouter = require("./routes/portfolioRoute.js");
const fundRouter = require("./routes/fundRoute.js");
const cryptoRouter = require("./routes/cryptoRoute.js");

app.use(cookieParser());
app.use(logger("dev"));
app.use(express.json());
app.use(cors());
app.use(i18nextMiddleware.handle(i18next));

app.use(
  "/api",
  userRouter,
  stockRouter,
  currencyRouter,
  goldRouter,
  portfolioRouter,
  fundRouter,
  cryptoRouter
);
app.use("/auth", authRouter);

app.listen(port, () => {
  connect();
  console.log(`Server is running on port ${port}`);
});

app.use(errorHandler);
