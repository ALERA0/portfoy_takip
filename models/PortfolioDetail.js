const mongoose = require("mongoose");

const allowedTypes = ["Stock", "Gold", "Currency"];

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
  unitPrice: {
    type: Number,
    required: false,
  },
  purchaseDate: {
    type: Date,
    required: false,
  },
});

portfolioDetailSchema.pre('save', function (next) {
    this.name = this.name.toUpperCase(); 
    next();
  });


module.exports = mongoose.model("PortfolioDetail", portfolioDetailSchema);
