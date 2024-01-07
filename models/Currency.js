const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema({
  lastPrice: {
    type: String,
  },
  currencyName: {
    type: String,
  },
  currencyDesc: {
    type: String,
  },
  changePercent: {
    type: String,
  },
});

module.exports = mongoose.model("Currency", currencySchema);
