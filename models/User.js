const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  roles: [
    {
      type: String,
      default: "Employee",
    },
  ],
  active: {
    type: Boolean,
    default: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now, // Kayıt tarihini otomatik olarak ayarlar
  },
  accessExpiration: {
    type: Date,
  },
});

module.exports = mongoose.model("User", userSchema);