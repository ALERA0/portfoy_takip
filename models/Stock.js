const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  lastPrice: {
    type: String,
  },
  name: {
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

module.exports = mongoose.model("Stock", stockSchema);
