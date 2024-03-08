const asyncHandler = require("express-async-handler");
const Gold = require("../models/Gold");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const redisClient = require("../shared/redis.js")();

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

  const responseData = {
    status: "success",
    message: "Altın / Gümüş detayı başarıyla getirildi",
    name: goldName.name,
    fullName: goldName.name,
    lastPrice: parseFloat(goldName.lastPrice),
    data: formattedData,
  };
  res.status(200).json(responseData);
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

  if (searchParam === undefined || searchParam === null || searchParam === "") {
    const cachedGold = await redisClient.get("goldData");
    if (cachedGold) {
      // Redis'teki veriyi döndür
      return res.status(200).json({
        status: "success",
        message: "Altınlar Redis'ten başarıyla getirildi",
        data: JSON.parse(cachedGold),
      });
    } else {
      const data = await Gold.find(query);
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
      return res.status(200).json({
        status: "success",
        message: "Altınlar başarıyla getirildi",
        data: formattedData,
      });
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
  res.status(200).json({
    status: "success",
    message: "Altın / Gümüş verisi başarıyla getirildi",
    data: formattedData,
  });
});

module.exports = { getGoldDetail, searchGold };
