const express = require("express");
const connectDB = require("./config/db");

const session = require('express-session');
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const Appointment = require("./models/appointment");
const Patient = require("./models/patient");
const Doctor = require("./models/doctor");

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({
  secret: 'starkSuperSecret',
  resave: false,
  saveUninitialized: false
}));
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};
app.get('/login', (req, res) => {
  res.send(`
    <h2>🔒 Access Restricted</h2>
    <form method="POST" action="/login">
      <input type="password" name="password" placeholder="Enter Password" required />
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
  const enteredPassword = req.body.password;
  const correctPassword = '12ab34cd';

  if (enteredPassword === correctPassword) {
    req.session.authenticated = true;
    res.redirect('/dashboard');
  } else {
    res.send('Incorrect password. <a href="/login">Try again</a>');
  }
});

connectDB();

app.use("/patients", requireAuth, patientRoutes);
app.use("/doctors", requireAuth, doctorRoutes);
app.use("/appointments", requireAuth, appointmentRoutes);

app.get("/", (req, res) => res.redirect("dashboard"));

app.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient")
      .populate("doctor")
      .sort("appointmentDate")
      .limit(3);

    const patients = await Patient.find()
      .sort({ age: -1 })
      .limit(5);

    
    const doctors = await Doctor.find()
      .limit(3)
      .sort({ experience: -1 })

    res.render("dashboard", { appointments, patients, doctors });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Failed to load dashboard.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
