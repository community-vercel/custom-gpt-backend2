const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  name: String,
  role: { type: String, default: "user" }, // 'user' or 'admin'
  active: { type: Boolean, default: true }, // true or false
  googleId: String,       // For Google OAuth users
  image: String,          // For profile picture from Google
  provider: String,       // 'credentials' or 'google'
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);