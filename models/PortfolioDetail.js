const mongoose = require("mongoose");

const allowedTypes = ["Stock", "Gold", "Currency", "TurkishLira", "Crypto", "Fund"];

const portfolioDetailSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: allowedTypes,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: false,
  },
  lastPrice: {
    type: Number,
    required: false,
  },
  profitPercentage: {
    type: Number,
    required: false,
  },
  totalAssetValue: {
    type: Number,
    required: false,
  },
  purchaseDate: {
    type: Date,
    required: false,
  },
});

portfolioDetailSchema.pre("save", function (next) {
  this.name = this.name.toUpperCase();
  next();
});

module.exports = mongoose.model("PortfolioDetail", portfolioDetailSchema);
