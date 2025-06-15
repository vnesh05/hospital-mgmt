const express = require("express");
const router = express.Router();
const {
  getPatients,
  getUpdatePatient,
  postUpdatePatient
} = require("../controllers/patientController");
const Patient = require("../models/patient");

// List patients via API (JSON)
router.get("/list", getPatients);

// Show Add Patient Form
router.get("/add", (req, res) => {
  res.render("patients/add");
});

// Handle add patient form submission
router.post("/add", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.redirect("/patients/view");
  } catch (err) {
    res.status(500).send("Error adding patient.");
  }
});

// Show list view (EJS)
router.get("/view", async (req, res) => {
  const patients = await Patient.find();
  res.render("patients/list", { patients });
});

// Show update form
router.get("/update/:id", getUpdatePatient);

// Handle update form submission
router.post("/update/:id", postUpdatePatient);

module.exports = router;
