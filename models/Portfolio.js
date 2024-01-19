const mongoose = require("mongoose");
const PortfolioDetail = require("./PortfolioDetail");

const portfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
  },
  portfolioDetails: [PortfolioDetail.schema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Portfolio", portfolioSchema);
