const Appointment = require("../models/appointment");

/**
 * Add an appointment.
 * - Patient: only for themselves
 * - Admin/staff: can choose patient (and doctor)
 */
exports.addAppointment = async (req, res) => {
  try {
    let appointmentData = req.body;

    // If current user is a patient, force appointment for themselves (ignore input)
    if (req.user && req.user.role === 'patient') {
      appointmentData.patient = req.user.patient; // req.user.patient = patient's ObjectId
    }
    // If doctor: may restrict so doctor can only assign for themselves
    if (req.user && req.user.role === 'doctor') {
      appointmentData.doctor = req.user.doctor; // req.user.doctor = doctor's ObjectId
      // Optionally: restrict doctors from booking for random patients unless needed
    }

    const newAppointment = new Appointment(appointmentData);
    await newAppointment.save();
    res.redirect("/appointments/view");
  } catch (err) {
    res.status(500).send("Error adding appointment.");
  }
};

/**
 * Get appointments list.
 * - Patient: only their own
 * - Doctor: only their own
 * - Admin: all
 */
exports.getAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user) {
      if (req.user.role === 'patient') {
        filter.patient = req.user.patient;
      } else if (req.user.role === 'doctor') {
        filter.doctor = req.user.doctor;
      }
      // if admin, see all
    }
    const appointments = await Appointment.find(filter)
      .populate("patient")
      .populate("doctor");
    res.render("appointments/list", { appointments, user: req.user });
  } catch (err) {
    res.status(500).send("Error fetching appointments.");
  }
};

/**
 * Delete appointment.
 * - Patient: only their own
 * - Doctor: only their own
 * - Admin: any
 */
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.body.id);
    if (!appointment) return res.status(404).send("Appointment not found.");

    if (req.user.role === 'patient' && String(appointment.patient) !== String(req.user.patient)) {
      return res.status(403).send("Not authorized");
    }
    if (req.user.role === 'doctor' && String(appointment.doctor) !== String(req.user.doctor)) {
      return res.status(403).send("Not authorized");
    }
    // Admin: allowed

    await Appointment.findByIdAndDelete(req.body.id);
    res.redirect("/appointments/view");
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting appointment');
  }
};