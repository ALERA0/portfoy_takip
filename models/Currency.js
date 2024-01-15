const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema({
  lastPrice: {
    type: String,
  },
  name: {
    type: String,
  },
  desc: {
    type: String,
  },
  changePercent: {
    type: String,
  },
  addedDate: {
    type: Date,
    default: Date.now, 
  },
});

module.exports = mongoose.model("Currency", currencySchema);
