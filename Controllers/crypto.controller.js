const asyncHandler = require("express-async-handler");
const Crypto = require("../models/Crypto");
const { errorCodes } = require("../shared/handlers/error/errorCodes.js");
const { customError } = require("../shared/handlers/error/customError.js");
const redisClient = require("../shared/redis.js")();


const getCryptoDetail = asyncHandler(async (req, res) => {
  const { name, numberOfDays } = req.params;

  const cryptoName = await Crypto.findOne({
    name:name
  }).sort({ addedDate: -1 });

  if (!cryptoName) {
    throw new customError(errorCodes.CRYPTO_NOT_FOUND);
  }

  const data = await Crypto.find({ name: name })
    .sort({ addedDate: -1 })
    .limit(parseInt(numberOfDays));

  const formattedData = data.map((item, index, array) => ({
    value: parseFloat(item.lastPrice.replace("$", "").replace(",", "")),
    date: item.addedDate.toISOString().split("T")[0],
    label:
      index === 0 || index === array.length - 1
        ? item.addedDate.toISOString().split("T")[0]
        : null,
  }));

  res.status(200).json({
    status: "success",
    message: "Crypto detail successfully retrieved",
    name: cryptoName.name,
    lastPrice: cryptoName.lastPrice,
    description: cryptoName.desc,
    data: formattedData,
  });
});

const searchCrypto = asyncHandler(async (req, res) => {
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
    const cachedCrypto = await redisClient.get("cryptoData");
    if (cachedCrypto) {
      // Return the data from Redis
      return res.status(200).json({
        status: "success",
        message: "Cryptos successfully retrieved from Redis",
        data: JSON.parse(cachedCrypto),
      });
    }

    // Get the cryptos added today
    const data = await Crypto.find(query).skip(skip).limit(limit);

    // Save the data to Redis
    await redisClient.set(
      "cryptoData",
      JSON.stringify(data),
      "EX",
      24 * 60 * 60
    ); // 1 hour TTL

    res.status(200).json({
      status: "success",
      message: "Cryptos successfully retrieved",
      data,
    });
  } else {
    // Search for the cryptos
    query = {
      name: new RegExp(`^${searchParam}`, "i"),
    };

    const data = await Crypto.find(query).skip(skip).limit(limit);

    res.status(200).json({
      status: "success",
      message: "Cryptos successfully retrieved",
      data,
    });
  }
});

module.exports = {
  getCryptoDetail,
  searchCrypto
};
