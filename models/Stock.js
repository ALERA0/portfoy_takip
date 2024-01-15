const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  lastPrice: {
    type: String,
  },
  name: {
    type: String,
    index: true,
  },
  changePercent: {
    type: String,
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
});


stockSchema.pre('save', function (next) {
  this.name = this.name.toUpperCase(); 
  next();
});

module.exports = mongoose.model("Stock", stockSchema);
