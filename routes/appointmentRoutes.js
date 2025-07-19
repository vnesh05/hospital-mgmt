const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const { addAppointment, getAppointments, deleteAppointment } = require("../controllers/appointmentController");

// IMPORTANT: Auth/role middleware -- update the import path as per your setup!
const { requireAuth } = require("../middleware/auth");

// Show form to schedule appointment
router.get("/add", requireAuth, async (req, res) => {
  try {
    let patients = [];
    if (req.user.role === 'admin') {
      patients = await Patient.find();
    } else if (req.user.role === 'patient') {
      // Only allow the logged-in patient to book for themselves
      const patient = await Patient.findById(req.user.patient);
      patients = patient ? [patient] : [];
    }
    // If you want doctors to book appointments, you could further customize here

    const doctors = await Doctor.find();
    res.render("appointments/add", { patients, doctors, user: req.user });
  } catch (err) {
    res.status(500).send("Error loading appointment form.");
  }
});

// Handle appointment form submission (controller ensures role logic)
router.post("/add", requireAuth, addAppointment);

// View appointments list (filtered in controller)
router.get("/view", requireAuth, getAppointments);

// Delete appointment (filtered in controller)
router.post("/delete", requireAuth, deleteAppointment);

module.exports = router;