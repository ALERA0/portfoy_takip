const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  lastPrice: {
    type: String,
  },
  stockName: {
    type: String,
  },
  changePercent: {
    type: String,
  },
});

module.exports = mongoose.model("Stock", stockSchema);
