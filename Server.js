// Copyright ©2024 ranalimayadunne, All rights reserved.
const express = require("express"); // Importing Express.js framework
const axios = require("axios"); // Importing Axios for making HTTP requests
const cors = require("cors"); // Importing CORS middleware for enabling Cross-Origin Resource Sharing
const mongoose = require("mongoose"); // Importing Mongoose for MongoDB interactions
const bcrypt = require("bcryptjs"); // Importing bcrypt for password hashing
const jwt = require("jsonwebtoken"); // Importing JSON Web Token for user authentication
require("dotenv").config();

const app = express(); // Creating an Express application
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3001; // Defining the port number
app.use(cors()); // Using CORS middleware to enable Cross-Origin Resource Sharing
app.use(express.json()); // Parsing incoming JSON requests

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://mayadunneranali:<password>@workwindb.qk6ps.mongodb.net/WorkWinDB?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User schema
const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    profession: String,
    contact: String,
  },
  { versionKey: false }
); // Set versionKey option to false to exclude __v field in the MongoDB cluster

// Define User model
const User = mongoose.model("users", userSchema);

// Define API endpoint for adding a new user
/**
 * Add new user.
 * @name POST/api/user
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.body.username - Username of the new user.
 * @param {string} req.body.email - Email of the new user.
 * @param {string} req.body.password - Password of the new user.
 * @param {string} req.body.profession - Profession of the new user.
 * @param {string} req.body.contact - Contact number of the new user.
 * @returns {Object} Response object indicating success or failure of user addition.
 */
app.post("/api/user", async (req, res) => {
  try {
    const { username, email, password, profession, contact } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "This email has already been used!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add +94 for the contact number
    const finalContactNumber = "+94" + contact;

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profession,
      contact: finalContactNumber,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Failed to add user" });
  }
});

// Define API endpoint for retrieving a specific user's personal details by email
/**
 *
 * Retrieve a specific user's personal details by email.
 * @name GET/api/users/:email
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} email - The email of the user.
 * @returns {Object} Response object containing user's personal details.
 */
app.get("/api/users/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const { contact } = user;
      const { username } = user;
      const { profession } = user;
      const { password } = user;
      res.json({
        contact: contact,
        username: username,
        profession: profession,
        password: password,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
});

// Define API endpoint for retrieving all users
/**
 * Retrieve all users.
 * @name GET/api/users
 * @function
 * @memberof module:Server
 * @inner
 * @returns {Object} Response object containing array of user details.
 */
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

// Define API endpoint for updating user details
app.put("/api/users/:email", async (req, res) => {
  const { email } = req.params;
  const { contact, profession } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { contact, profession } },
      { new: true }
    );
    if (user) {
      res.json({ message: "User details updated successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Failed to update user details" });
  }
});

// Define API endpoint for changing user password
app.put("/api/user/:email/password", async (req, res) => {
  const { email } = req.params;
  const { newPassword } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "mayadunneranali@gmail.com",
    pass: "<password>",
  },
});

app.post("/api/send-email", async (req, res) => {
  const { subject, feedback } = req.body;

  const mailOptions = {
    from: "mayadunneranali@gmail.com",
    to: "mayadunneranali@gmail.com",
    subject: `Feedback: ${subject}`,
    text: feedback,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Feedback submission unsuccessful! Try again!");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send("Thanks for sharing your feedback with us..");
    }
  });
});

// Define the user activity route
app.get("/api/user-activity", (req, res) => {
  res.status(200).json({
    userActivity: [
      { date: "2024-08-10", count: 50 },
      { date: "2024-08-11", count: 0 },
      { date: "2024-08-12", count: 0 },
      { date: "2024-08-13", count: 40 },
      { date: "2024-08-14", count: 0 },
      { date: "2024-08-15", count: 0 },
      { date: "2024-08-16", count: 20 },
      { date: "2024-08-17", count: 0 },
      { date: "2024-08-18", count: 0 },
      { date: "2024-08-19", count: 0 },
      { date: "2024-08-20", count: 40 },
      { date: "2024-08-21", count: 0 },
      { date: "2024-08-22", count: 0 },
      { date: "2024-08-23", count: 60 },
      { date: "2024-08-24", count: 20 },
      { date: "2024-08-25", count: 0 },
      { date: "2024-08-26", count: 0 },
      { date: "2024-08-27", count: 0 },
      { date: "2024-08-28", count: 20 },
      { date: "2024-08-29", count: 0 },
      { date: "2024-08-30", count: 0 },
      { date: "2024-08-31", count: 80 },
      { date: "2024-09-01", count: 0 },
      { date: "2024-09-02", count: 30 },
      { date: "2024-09-03", count: 0 },
      { date: "2024-09-04", count: 0 },
      { date: "2024-09-05", count: 100 },
      { date: "2024-09-06", count: 40 },
    ],
  });
});

/**
 *
 * Authenticate user login.
 * @name POST/api/login
 * @function
 * @memberof module:Server
 * @inner
 * @param {string} req.body.email - User's email address.
 * @param {string} req.body.password - User's password.
 * @returns {Object} Response object containing authentication token and username upon successful login.
 */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, "Work&Win@UniOfBeds");

    // Send response with token
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
