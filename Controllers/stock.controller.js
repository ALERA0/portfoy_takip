const asyncHandler = require("express-async-handler");
const Stock = require("../models/Stock");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const redisClient = require("../shared/redis.js")();
const {
  customSuccess,
} = require("../shared/handlers/success/customSuccess.js");
const { successCodes } = require("../shared/handlers/success/successCodes.js");

const getStockDetail = asyncHandler(async (req, res) => {
  const { name, numberOfDays } = req.params;

  const data = await Stock.find({ name: new RegExp(name, "i") })
    .sort({ addedDate: -1 })
    .limit(parseInt(numberOfDays));

  const stockInfo = await Stock.findOne({ name: new RegExp(name, "i") }).sort({
    addedDate: -1,
  });

  if (!stockInfo || stockInfo.length === 0) {
    console.log(stockInfo);
    console.log("STOCK ERRRRORR");
    throw new customError(errorCodes.STOCK_NOT_FOUND);
  }

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
  const nameArray = stockInfo ? stockInfo.name.split(" ") : [];
  const namePart1 = nameArray.length > 0 ? nameArray[0] : "";
  const namePart2 = nameArray.length > 1 ? nameArray.slice(1).join(" ") : "";

  const successResponse = new customSuccess(successCodes.STOCKS_SUCCESS, {
    fullName: stockInfo.name,
    name: namePart1,
    description: namePart2,
    lastPrice: parseFloat(stockInfo.lastPrice.replace(",", ".")),
    data: formattedData,
  });

  res.json(successResponse);


});

const searchStock = asyncHandler(async (req, res) => {
  let { searchParam } = req.params;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let query = {
    addedDate: { $gte: today },
  };

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  if ((searchParam === undefined || searchParam === null) && page === 1) {
    // // const cachedStocks = await redisClient.get("stockData");
    // if (cachedStocks) {
    //   // Redis'teki veriyi döndür
    //   const successResponse = new customSuccess(successCodes.STOCKS_SUCCESS, {
    //     data: JSON.parse(cachedStocks),
    //   });
    //   return res.json(successResponse);
    // } else {
      const data = await Stock.find(query).skip(skip).limit(limit);
      // Response formatını güncelle
      const formattedData = data.map((stock) => {
        const [name, ...descParts] = stock.name.split(" ");
        const desc = descParts.join(" "); // Kalan kısmı birleştir
        return {
          _id: stock._id,
          lastPrice: stock.lastPrice,
          name,
          desc,
          changePercent: stock.changePercent,
          addedDate: stock.addedDate,
          __v: stock.__v,
        };
      });

      // await redisClient.set(
      //   "stockData",
      //   JSON.stringify(formattedData),
      //   "EX",
      //   24 * 60 * 60
      // );

      const successResponse = new customSuccess(successCodes.STOCKS_SUCCESS, {
        data: formattedData,
      });
      return res.json(successResponse);
    // }
  }

  // Eğer searchParam varsa ve boş değilse, adı belirtilen şekilde de filtrele
  if (searchParam && searchParam.trim() !== "") {
    query.name = new RegExp(`^${searchParam}`, "i");
  }

  const data = await Stock.find(query).skip(skip).limit(limit);

  // Response formatını güncelle
  const formattedData = data.map((stock) => {
    const [name, ...descParts] = stock.name.split(" ");
    const desc = descParts.join(" "); // Kalan kısmı birleştir
    return {
      _id: stock._id,
      lastPrice: stock.lastPrice,
      name,
      desc,
      changePercent: stock.changePercent,
      addedDate: stock.addedDate,
      __v: stock.__v,
    };
  });

  const successResponse = new customSuccess(successCodes.STOCKS_SUCCESS, {
    data: formattedData,
  });
  return res.json(successResponse);

});

module.exports = { getStockDetail, searchStock };
