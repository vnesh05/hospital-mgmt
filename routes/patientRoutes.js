const express = require("express");
const router = express.Router();
const {
  getPatients,
  getUpdatePatient,
  postUpdatePatient,
  addPatient
} = require("../controllers/patientController");

const { requireAuth, requireRole } = require("../middleware/auth");
const Patient = require("../models/patient");
const Appointment = require("../models/appointment");

// ---- API: List patients (admins, doctors see all, patients only themselves)
router.get("/list", requireAuth, getPatients);

// ---- Show Add Patient Form (admin only)
router.get("/add", requireAuth, requireRole("admin"), (req, res) => {
  res.render("patients/add", { user: req.user });
});

// ---- Handle add patient form submission (admin only)
router.post("/add", requireAuth, requireRole("admin"), addPatient);

// ---- Show list view (admins, doctors see all, patients only themselves)
router.get("/view", requireAuth, async (req, res) => {
  let filter = {};
  if (req.user.role === "patient") {
    filter._id = req.user.patient;
  }
  // Optionally filter for doctors: assigned patients only
  // else if (req.user.role === "doctor") {
  //   filter.doctorAssigned = req.user.doctor;
  // }
  const patients = await require("../models/patient").find(filter);
  res.render("patients/list", { patients, user: req.user });
});

// ---- Show update form (auth controlled in controller)
router.get("/update/:id", requireAuth, getUpdatePatient);

// ---- Handle update form submission (auth controlled in controller)
router.post("/update/:id", requireAuth, postUpdatePatient);

// ---- Patient dashboard (patient only)
router.get('/dashboard', requireAuth, requireRole('patient'), async (req, res) => {
  try {
    // Load patient profile by the logged-in user's patient ref
    const patient = await Patient.findById(req.user.patient).populate('doctorAssigned');
    if (!patient) return res.status(404).send("Patient not found.");

    // Load patient's appointments
    const appointments = await Appointment.find({ patient: patient._id })
      .populate("doctor")
      .sort({ appointmentDate: 1 });

    res.render("patients/dashboard", { patient, appointments, user: req.user });
  } catch (err) {
    res.status(500).send("Error loading patient dashboard.");
  }
});

module.exports = router;
