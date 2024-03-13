const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalValue:{
    type:Number,
    default:0
  },
  totalProfitValue:{
    type:Number,
    default:0
  },
  totalProfitPercentage:{
    type:Number,
    default:0
  },
});


module.exports = mongoose.model("Budget", budgetSchema);
