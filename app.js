const express = require("express");
const connectDB = require("./config/db");
const session = require('express-session');
const bcrypt = require('bcryptjs');                // NEW: for password hashing/comparison
const User = require('./models/user');             // NEW: your User model!
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

// --- NEW: Middleware to load req.user for each request
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      req.user = user || null;
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

// --- NEW: Require login for protected views/routes
function requireAuth(req, res, next) {
  if (req.user) return next();
  res.redirect('/login');
}

// --- Optional: Middleware to require role(s)
function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    res.status(403).send("Forbidden: Insufficient permissions.");
  };
}

// --- Render a clean EJS login form
app.get('/login', (req, res) => {
  res.render('login', { error: undefined });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Login by username (or you can search by email if you wish)
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;

      // Redirect based on role
      if (user.role === 'admin') return res.redirect('/dashboard');
      if (user.role === 'doctor') return res.redirect('/doctors/dashboard');   // Create this if you want!
      if (user.role === 'patient') return res.redirect('/patients/dashboard'); // Create this if you want!
      return res.redirect('/dashboard');
    } else {
      res.render('login', { error: "Invalid credentials. Please try again." });
    }
  } catch (err) {
    res.render('login', { error: "Login error. Please try again." });
  }
});

// --- Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// --- Connect DB
connectDB();

// --- Mount protected routes
app.use("/patients", requireAuth, patientRoutes);
app.use("/doctors", requireAuth, doctorRoutes);
app.use("/appointments", requireAuth, appointmentRoutes);

// --- Main dashboard (admin)
app.get("/", (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  if (req.user.role === 'admin') {
    return res.redirect('/dashboard');
  }
  if (req.user.role === 'doctor') {
    return res.redirect('/doctors/dashboard');
  }
  if (req.user.role === 'patient') {
    return res.redirect('/patients/dashboard');
  }
  // fallback for unknown roles
  return res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register', { error: undefined });
});

app.post('/register', async (req, res) => {
  try {
    const {
      username, password, name, age, gender, contactNumber,
      address, bloodGroup, medicalHistory
    } = req.body;

    // Check for existing username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { error: "Username already taken." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = new User({
      username,
      password: hashedPassword,
      role: 'patient'
    });
    await user.save();

    // Create Patient profile
    const patient = new Patient({
      name,
      age,
      gender,
      contactNumber,
      address,
      bloodGroup,
      medicalHistory: medicalHistory ? medicalHistory.split(",").map(s => s.trim()) : [],
      user: user._id
    });
    await patient.save();

    // Link both sides (optional, but good for back-filling user to patient)
    user.patient = patient._id;
    await user.save();

    res.redirect('/login');
  } catch (err) {
    res.render('register', { error: "Registration error: " + err.message });
  }
});
app.get("/dashboard", requireAuth, async (req, res) => {
  try {
    // If you want, redirect based on req.user.role as above

    // Admin dashboard summary:
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
      .sort({ experience: -1 });

    res.render("dashboard", { appointments, patients, doctors, user: req.user });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Failed to load dashboard.");
  }
});

// --- Optionally: Add doctor/patient specific dashboards if desired
// app.get("/doctors/dashboard", ...)
// app.get("/patients/dashboard", ...)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));