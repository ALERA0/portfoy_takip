const asyncHandler = require("express-async-handler");
const Currency = require("../models/Currency");
const { errorCodes } = require("../shared/handlers/error/errorCodes.js");
const { customError } = require("../shared/handlers/error/customError.js");
const redisClient = require("../shared/redis.js")();
const {
  customSuccess,
} = require("../shared/handlers/success/customSuccess.js");
const { successCodes } = require("../shared/handlers/success/successCodes.js");

const getCurrencyDetail = asyncHandler(async (req, res) => {
  const { name, numberOfDays } = req.params;

  const currencyName = await Currency.findOne({
    name: new RegExp(name, "i"),
  }).sort({ addedDate: -1 });

  if (!currencyName) {
    throw new customError(errorCodes.CURRENCY_NOT_FOUND);
  }

  const data = await Currency.find({ name: new RegExp(name, "i") })
    .sort({ addedDate: -1 })
    .limit(parseInt(numberOfDays));

  const formattedData = data.map((item, index, array) => ({
    value: parseFloat(item.lastPrice.replace(",", ".")),
    date: item.addedDate.toISOString().split("T")[0],
    label:
      index === 0 || index === array.length - 1
        ? item.addedDate.toISOString().split("T")[0]
        : null,
  }));
  const successResponse = new customSuccess(
    successCodes.CURRENCY_DETAIL_SUCCESS,
    {
      name: currencyName.name,
      lastPrice: parseFloat(currencyName.lastPrice.replace(",", ".")),
      description: currencyName.desc,
      data: formattedData,
    }
  );

  res.json(successResponse);
});

const searchCurrency = asyncHandler(async (req, res) => {
  let { searchParam } = req.params;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let query = {
    addedDate: { $gte: today },
  };

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if ((searchParam === undefined || searchParam === null) && page === 1) {
    const cachedCurrency = await redisClient.get("currencyData");
    if (cachedCurrency) {
      // Redis'teki veriyi döndür
      const successResponse = new customSuccess(
        successCodes.CURRENCY_SEARCH_SUCCESS,
        {
          data: JSON.parse(cachedCurrency),
        }
      );

      res.json(successResponse);
    } else {
      const data = await Currency.find(query).skip(skip).limit(limit);
      const formattedData = data.map((currency) => ({
        ...currency.toObject(),
        changePercent: currency.changePercent.replace("%", ""),
      }));

      await redisClient.set(
        "currencyData",
        JSON.stringify(formattedData),
        "EX",
        24 * 60 * 60
      );

      const successResponse = new customSuccess(
        successCodes.CURRENCY_SEARCH_SUCCESS,
        {
          data: formattedData,
        }
      );

      res.json(successResponse);
    }
  }

  // Eğer searchParam varsa ve boş değilse, adı belirtilen şekilde de filtrele
  if (searchParam && searchParam.trim() !== "") {
    query.name = new RegExp(`^${searchParam}`, "i");
  }

  const data = await Currency.find(query).skip(skip).limit(limit);
  // Değişiklik: changePercent alanındaki % işaretini kaldır
  const formattedData = data.map((currency) => ({
    ...currency.toObject(),
    changePercent: currency.changePercent.replace("%", ""),
  }));

  const successResponse = new customSuccess(
    successCodes.CURRENCY_SEARCH_SUCCESS,
    {
      data: formattedData,
    }
  );

  res.json(successResponse);
});

module.exports = { getCurrencyDetail, searchCurrency };
