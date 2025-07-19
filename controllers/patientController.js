const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

// Add new patient + User login
exports.addPatient = async (req, res) => {
  try {
    // Extract or generate login credentials
    const { name, age, gender, contactNumber, address, bloodGroup, medicalHistory, doctorAssigned, username, password } = req.body;
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Patient profile
    const newPatient = new Patient({
      name, age, gender, contactNumber, address, bloodGroup, medicalHistory, doctorAssigned
    });
    await newPatient.save();

    // 2. Create user login
    const newUser = new User({
      username: username || contactNumber,
      password: hashedPassword,
      role: "patient",
      patient: newPatient._id
    });
    await newUser.save();

    // 3. Link user to profile
    newPatient.user = newUser._id;
    await newPatient.save();

    res.redirect("/patients/view");
  } catch (err) {
    res.status(500).send("Error adding patient.");
  }
};

/**
 * GET /patients/api/list
 * - Admins/doctors see all patients (optionally filter for doctors)
 * - Patients see only their own profile
 */
exports.getPatients = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "patient") {
      // Only return this patient's own info
      filter._id = req.user.patient;
    }
    // Optional: If you want doctors to see only their assigned patients, uncomment:
    // else if (req.user.role === "doctor") {
    //   filter.doctorAssigned = req.user.doctor;
    // }
    // Otherwise, doctor and admin see all

    const patients = await Patient.find(filter);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Handle Patient update form submission
 * - Patients: may only update their own data
 * - Doctors/admin: may update anyone
 */
exports.postUpdatePatient = async (req, res) => {
  try {
    // Allow only patient themselves or doctor/admin to update
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).send("Patient not found.");

    // Prevent unauthorized update:
    if (req.user.role === 'patient' && String(patient._id) !== String(req.user.patient)) {
      return res.status(403).send("Not authorized to update this profile.");
    }

    // If all is fine, proceed with update
    await Patient.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      medicalHistory: req.body.medicalHistory
        ? req.body.medicalHistory.split(",").map(item => item.trim())
        : [],
      doctorAssigned: req.body.doctorAssigned || null,
    });

    res.redirect("/patients/view");
  } catch (err) {
    console.error("Error updating patient:", err);
    res.status(500).send("Error updating patient.");
  }
};

/**
 * GET /patients/update/:id
 * - Get patient update form
 * - Only allow patient themselves/doctors/admins to access
 */
exports.getUpdatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).send("Patient not found.");

    // Prevent random patients from updating others:
    if (req.user.role === 'patient' && String(patient._id) !== String(req.user.patient)) {
      return res.status(403).send("Not authorized to view this profile.");
    }
    // For doctors & admins: permitted

    const doctors = await Doctor.find(); // For assigning doctor (dropdown)

    res.render("patients/update", { patient, doctors, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving patient.");
  }
};