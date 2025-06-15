const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  experience: { type: Number, required: true } // in years
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);