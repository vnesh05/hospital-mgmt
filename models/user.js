const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },         // Store as bcrypt hash!
  role: { type: String, enum: ["admin", "doctor", "patient"], required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },   // Only for doctor role
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }  // Only for patient role
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
