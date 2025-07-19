const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment"); // <-- Needed for dashboard!
const { addDoctor, getDoctors } = require("../controllers/doctorController");
const { requireAuth, requireRole } = require("../middleware/auth");

// =====================
// API Routes (JSON)
// =====================

// Add doctor via API (admin only)
router.post("/api/add", requireAuth, requireRole("admin"), addDoctor);

// Get doctors via API (any authenticated user)
router.get("/api/list", requireAuth, getDoctors);

// =====================
// View Routes (EJS Pages)
// =====================

// Show list of doctors (EJS view, any authenticated user)
router.get("/view", requireAuth, async (req, res) => {
  try {
    const doctors = await Doctor.find();
    doctors.sort((a, b) => b.experience - a.experience);
    res.render("doctors/list", { doctors, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching doctors.");
  }
});

// Show add doctor form (admin only)
router.get("/add", requireAuth, requireRole("admin"), (req, res) => {
  res.render("doctors/add", { user: req.user });
});

// Handle form submission from EJS (admin only)
router.post("/add", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    // Use the controller so the user and doctor are both created and linked!
    await addDoctor(req, res);
    // If your controller doesn't redirect, you could add:
    // res.redirect("/doctors/view");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding doctor.");
  }
});

// Doctor dashboard (for the currently logged in doctor, or for admin as optional observer)
// If admin: can choose doctor by ?id= param, else doctor sees their own dashboard
router.get("/dashboard", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  try {
    let doctorId;

    // Admin can view any doctor's dashboard by URL: /doctors/dashboard?id=doctorObjectId
    if (req.user.role === "admin" && req.query.id) {
      doctorId = req.query.id;
    } else if (req.user.role === "doctor") {
      doctorId = req.user.doctor;
    } else {
      return res.status(400).send("Doctor not specified.");
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).send("Doctor not found.");

    // Fetch that doctor's appointments (future and past) with patient info
    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate("patient")
      .sort({ appointmentDate: 1 });

    res.render("doctors/dashboard", { doctor, appointments, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading doctor dashboard.");
  }
});

module.exports = router;