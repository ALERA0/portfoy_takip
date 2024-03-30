const asyncHandler = require("express-async-handler");
const Fund = require("../models/Fund");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const redisClient = require("../shared/redis.js")();
const {
  customSuccess,
} = require("../shared/handlers/success/customSuccess.js");
const { successCodes } = require("../shared/handlers/success/successCodes.js");

const getFundDetail = asyncHandler(async (req, res) => {
  const { name, numberOfDays } = req.params;

  const data = await Fund.find({ name: new RegExp(name, "i") })
    .sort({ addedDate: -1 })
    .limit(parseInt(numberOfDays));

  if (!data) {
    throw new customError(errorCodes.FUND_NOT_FOUND);
  }

  const fundInfo = await Fund.findOne({ name: new RegExp(name, "i") }).sort({
    addedDate: -1,
  });

  // Verileri istenen formata çevir
  const formattedData = data.map((item, index, array) => ({
    value: parseFloat(item.lastPrice.replace(",", ".")),
    date: item.addedDate.toISOString().split("T")[0],
    label:
      index === 0 || index === array.length - 1
        ? item.addedDate.toISOString().split("T")[0]
        : null,
  }));

  // Name ve Desc alanlarını ayarlayın

  const successResponse = new customSuccess(successCodes.FUND_DETAIL_SUCCESS, {
    description: fundInfo.desc,
    fullName: fundInfo.desc,
    name: fundInfo.name,
    lastPrice: fundInfo.lastPrice,
    changePercent: fundInfo.changePercent,
    data: formattedData,
  });

  res.json(successResponse);
});

const searchFund = asyncHandler(async (req, res) => {
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
    const cachedFund = await redisClient.get("fundData");
    if (cachedFund) {
      // Redis'teki veriyi döndür

      const successResponse = new customSuccess(
        successCodes.FUND_SEARCH_SUCCESS,
        {
          data: JSON.parse(cachedFund),
        }
      );

      res.json(successResponse);
    } else {
      const data = await Fund.find(query).skip(skip).limit(limit);
      const formattedData = data.map((fund) => ({
        ...fund._doc,
        changePercent: parseFloat(fund.changePercent.replace(",", ".")).toFixed(
          2
        ),
      }));

      await redisClient.set(
        "fundData",
        JSON.stringify(formattedData),
        "EX",
        24 * 60 * 60
      );

      const successResponse = new customSuccess(
        successCodes.FUND_SEARCH_SUCCESS,
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

  const data = await Fund.find(query).skip(skip).limit(limit);

  const formattedData = data.map((fund) => ({
    ...fund._doc,
    changePercent: parseFloat(fund.changePercent.replace(",", ".")).toFixed(2),
  }));

  const successResponse = new customSuccess(successCodes.FUND_SEARCH_SUCCESS, {
    data: formattedData,
  });

  res.json(successResponse);
});

module.exports = { getFundDetail, searchFund };
