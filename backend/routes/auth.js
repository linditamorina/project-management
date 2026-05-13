// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const JWT_SECRET = 'vision_secret_key_2024'; // Mbaje të njëjtë kudo

// // REGISTER
// router.post('/register', async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ message: "This email already exists!" });

//     user = new User({ username, email, password });
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(password, salt);
//     await user.save();

//     res.status(201).json({ message: "User created successfully!" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// // LOGIN
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "Invalid credentials" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const payload = { user: { id: user.id } };
//     jwt.sign(payload, JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
//       if (err) throw err;
//       res.json({ token, user: { id: user.id, username: user.username } });
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth'); // KJO ESHTE SHTUAR: Për të ditur kush po e bën ndryshimin

const JWT_SECRET = 'vision_secret_key_2024';

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "This email already exists!" });

    user = new User({ username, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(201).json({ message: "User created successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE PROFILE (Rruga e re që i mungonte aplikacionit)
router.put('/update', auth, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Gjej user-in aktual nga ID-ja që ndodhet në Token
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ndrysho username-in nëse ka dërguar një të ri
    if (username) {
      user.username = username;
    }

    // Ndrysho fjalëkalimin vetëm nëse ka dërguar një të ri
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Kthe te dhenat e reja (pa e kthyer fjalëkalimin për siguri)
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ message: "Server error during update" });
  }
});

module.exports = router;