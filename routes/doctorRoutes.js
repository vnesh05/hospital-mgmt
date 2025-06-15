const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctor");
const { addDoctor, getDoctors } = require("../controllers/doctorController");

// =====================
// API Routes (JSON)
// =====================

// Add doctor via API
router.post("/api/add", addDoctor);

// Get doctors via API
router.get("/api/list", getDoctors);

// =====================
// View Routes (EJS Pages)
// =====================

// Show list of doctors (EJS view)
router.get("/view", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    doctors.sort((a, b) => b.experience - a.experience);
    res.render("doctors/list", { doctors });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching doctors.");
  }
});

// Show add doctor form (EJS view)
router.get("/add", (req, res) => {
  res.render("doctors/add");
});

// Handle form submission from EJS
router.post("/add", async (req, res) => {
  try {
    const newDoctor = new Doctor(req.body);
    await newDoctor.save();
    res.redirect("/doctors/view");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding doctor.");
  }
});

module.exports = router;
