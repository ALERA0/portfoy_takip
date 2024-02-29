const mongoose = require("mongoose");

const fundSchema = new mongoose.Schema({
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


fundSchema.pre('save', function (next) {
  this.name = this.name.toUpperCase(); 
  next();
});

module.exports = mongoose.model("Fund", fundSchema);
