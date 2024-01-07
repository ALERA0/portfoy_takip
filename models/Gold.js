const mongoose = require("mongoose");

const goldSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  price: {
    type: String,
  },

});

module.exports = mongoose.model("Gold", goldSchema);
