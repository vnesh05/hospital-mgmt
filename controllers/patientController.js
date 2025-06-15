const Patient = require("../models/patient");

// Show list of patients (for API JSON)
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Handle update form submission
exports.postUpdatePatient = async (req, res) => {
  try {
     // Debug log
    await Patient.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      medicalHistory: req.body.medicalHistory ? req.body.medicalHistory.split(",").map(item => item.trim()) : [],
      doctorAssigned: req.body.doctorAssigned || null
    });
    res.redirect("/patients/view");
  } catch (err) {
    console.error("Error updating patient:", err);
    res.status(500).send("Error updating patient.");
  }
};

const Doctor = require("../models/doctor");

exports.getUpdatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).send("Patient not found.");

    const doctors = await Doctor.find(); // Fetch all doctors for dropdown

    res.render("patients/update", { patient, doctors });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving patient.");
  }
};
