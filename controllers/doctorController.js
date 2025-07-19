const Doctor = require("../models/doctor");
const User = require("../models/user");
const bcrypt = require('bcryptjs');

// Add new doctor (and create corresponding User)
exports.addDoctor = async (req, res) => {
  try {
    const { name, specialization, contactNumber, email, experience, username, password } = req.body;

    // Validation: All required fields present?
    if (!name || !specialization || !contactNumber || !email || !experience || !username || !password) {
      return res.status(400).send("All doctor fields and login credentials are required.");
    }

    // 1. Check for duplicate email/username in User
    const existingUser = await User.findOne({ username: username || email });
    if (existingUser) {
      return res.status(400).send("Username or email already exists as a user.");
    }

    // 2. Check for duplicate email in Doctor
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).send("Doctor with this email already exists.");
    }

    // 3. Hash Doctor User's Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the Doctor record
    const newDoctor = new Doctor({
      name,
      specialization,
      contactNumber,
      email,
      experience,
    });
    await newDoctor.save();

    // 5. Create corresponding User account
    const newUser = new User({
      username: username || email,
      password: hashedPassword,
      role: 'doctor',
      doctor: newDoctor._id,
    });
    await newUser.save();

    // 6. Link doctor record to user
    newDoctor.user = newUser._id;
    await newDoctor.save();

    // 7. Redirect (edit as needed):
    // - Most apps: send admin back to doctor list not dashboard, unless you have '/doctors/dashboard' for admin overview.
    // - If doctor self-registers, you would set session and redirect to their dashboard.
    res.redirect("/doctors/view"); // or "/doctors/dashboard" if that's your workflow

  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding doctor: " + err.message);
  }
};

// Get all doctors (any authenticated user can see doctors)
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
