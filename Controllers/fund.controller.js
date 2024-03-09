const asyncHandler = require("express-async-handler");
const Fund = require("../models/Fund");
const { customError } = require("../shared/handlers/error/customError");
const { errorCodes } = require("../shared/handlers/error/errorCodes");
const redisClient = require("../shared/redis.js")();

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

  res.status(200).json({
    status: "success",
    message: "Fon detayı başarıyla getirildi",
    desc: fundInfo.desc,
    name: fundInfo.name,
    lastPrice: fundInfo.lastPrice,
    changePercent: fundInfo.changePercent,
    data: formattedData,
  });
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
      return res.status(200).json({
        status: "success",
        message: "Fonlar Redis'ten başarıyla getirildi",
        data: JSON.parse(cachedFund),
      });
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

      return res.status(200).json({
        status: "success",
        message: "Fonlar başarıyla getirildi",
        data: formattedData,
      });
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

  res.status(200).json({
    status: "success",
    message: "Fonlar başarıyla getirildi",
    data: formattedData,
  });
});

module.exports = { getFundDetail, searchFund };
