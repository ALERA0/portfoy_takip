const asyncHandler = require("express-async-handler");
const Gold = require("../models/Gold");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const redisClient = require("../shared/redis.js")();
const {
  customSuccess,
} = require("../shared/handlers/success/customSuccess.js");
const { successCodes } = require("../shared/handlers/success/successCodes.js");

const getGoldDetail = asyncHandler(async (req, res) => {
  const { name, day } = req.body;

  const goldName = await Gold.findOne({ name: name });
  const data = await Gold.find({ name: name })
    .sort({ addedDate: -1 })
    .limit(parseInt(day));

  if (!goldName) {
    throw new customError(errorCodes.GOLD_NOT_FOUND);
  }

  const formattedData = data.map((item, index, array) => ({
    value: parseFloat(item.lastPrice),
    date: item.addedDate.toISOString().split("T")[0],
    label:
      index === 0 || index === array.length - 1
        ? item.addedDate.toISOString().split("T")[0]
        : null,
  }));

  const successResponse = new customSuccess(successCodes.GOLD_DETAIL_SUCCESS, {
    name: goldName.name,
    fullName: goldName.name,
    lastPrice: parseFloat(goldName.lastPrice),
    data: formattedData,
  });

  res.json(successResponse);
});

const searchGold = asyncHandler(async (req, res) => {
  let { searchParam } = req.body;
  searchParam = searchParam.toUpperCase();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let query = {
    addedDate: { $gte: today },
  };

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (
    (searchParam === undefined || searchParam === null || searchParam === "") &&
    page === 1
  ) {
    const cachedGold = await redisClient.get("goldData");
    if (cachedGold) {
      // Redis'teki veriyi döndür

      const successResponse = new customSuccess(
        successCodes.GOLD_SEARCH_SUCCESS,
        {
          data: JSON.parse(cachedGold),
        }
      );

      res.json(successResponse);
    } else {
      const data = await Gold.find(query).skip(skip).limit(limit);
      const formattedData = data.map((currency) => ({
        ...currency.toObject(),
        changePercent: currency.changePercent.replace("%", ""),
      }));
      await redisClient.set(
        "goldData",
        JSON.stringify(formattedData),
        "EX",
        24 * 60 * 60
      );

      const successResponse = new customSuccess(
        successCodes.GOLD_SEARCH_SUCCESS,
        {
          data: formattedData,
        }
      );

      res.json(successResponse);
    }
  }

  if (searchParam && searchParam.trim() !== "") {
    query.name = new RegExp(`^${searchParam}`, "i");
  }
  const data = await Gold.find(query).skip(skip).limit(limit);
  const formattedData = data.map((currency) => ({
    ...currency.toObject(),
    changePercent: currency.changePercent.replace("%", ""),
  }));

  const successResponse = new customSuccess(successCodes.GOLD_SEARCH_SUCCESS, {
    data: formattedData,
  });

  res.json(successResponse);
});

module.exports = { getGoldDetail, searchGold };
