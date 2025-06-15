const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const { addAppointment, getAppointments, deleteAppointment } = require("../controllers/appointmentController");

// Show form to schedule appointment
router.get("/add", async (req, res) => {
  try {
    const patients = await Patient.find();
    const doctors = await Doctor.find();
    res.render("appointments/add", { patients, doctors });
  } catch (err) {
    res.status(500).send("Error loading appointment form.");
  }
});

// Handle appointment form submission
router.post("/add", addAppointment);

// View appointments list (EJS)
router.get("/view", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient")
      .populate("doctor");
    res.render("appointments/list", { appointments });
  } catch (err) {
    res.status(500).send("Error loading appointments.");
  }
});

router.post('/delete', deleteAppointment);

module.exports = router;