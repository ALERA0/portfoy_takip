const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5001;
dotenv.config();
const logger = require("morgan");
const cookieParser = require("cookie-parser");
// const redisClient = require('./shared/redis.js')();


app.set('trust proxy', 1);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};

const userRouter = require("./routes/userRoute.js");
const authRouter = require("./routes/authRoute.js");
const stockRouter = require("./routes/stockRoute.js");
const currencyRouter = require("./routes/currencyRoute.js");
const goldRouter = require("./routes/goldRoute.js");
const portfolioRouter = require("./routes/portfolioRoute.js");
const fundRouter = require("./routes/fundRoute.js");


app.use(cookieParser());
app.use(logger("dev"));
app.use(express.json());
app.use(cors());

app.use("/api", userRouter, stockRouter, currencyRouter, goldRouter,portfolioRouter,fundRouter);
app.use("/auth", authRouter);



app.listen(port, () => {
  connect();
  console.log(`Server is running on port ${port}`);
});
