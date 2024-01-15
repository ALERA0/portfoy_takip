const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema({
  lastPrice: {
    type: String,
  },
  name: {
    type: String,
    index: true,
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


currencySchema.pre('save', function (next) {
  this.name = this.name.toUpperCase(); 
  next();
});

module.exports = mongoose.model("Currency", currencySchema);
