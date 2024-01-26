const mongoose = require("mongoose");

const goldSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
  },
  lastPrice: {
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


goldSchema.pre('save', function (next) {
  this.name = this.name.toUpperCase(); 
  next();
});

module.exports = mongoose.model("Gold", goldSchema);
