const Appointment = require("../models/appointment");

exports.addAppointment = async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.redirect("/appointments/view");
  } catch (err) {
    res.status(500).send("Error adding appointment.");
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient")
      .populate("doctor");
    res.render("appointments/list", { appointments });
  } catch (err) {
    res.status(500).send("Error fetching appointments.");
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.body.id);
    res.redirect("/appointments/view");
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting appointment');
  }
};