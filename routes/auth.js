const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
    const { email, password, name, googleId, image, provider } = req.body;
  
    try {
      let user = await User.findOne({ email });
  
      if (user) {
        return res.status(400).json({ message: "User already exists." });
      }
  
      user = new User({
        email,
        password,
      
        role,
        name,
        googleId,
        image,
        provider,
      });
  
      await user.save();
  
      res.status(201).json({ message: "User created successfully.", user });
  
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ message: "Server error.", error });
    }
  });
  router.get("/users", async (req, res) => {
    try {
      const users = await User.find().select("-password"); // Exclude passwords
      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  router.delete("/users/:id", async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update a user by ID
  router.put("/users/:id", async (req, res) => {
    const { name, email,role,active, password, image, provider } = req.body;
    try {
      const updatedData = { name, email,role,active, image, provider };
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatedData.password = hashedPassword;
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updatedData },
        { new: true }
      );
      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  router.post("/adduser", async (req, res) => {
    const { name, email,role,active, password, image, provider } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        role,
        email,
        password: hashedPassword,
        active,
        image,
        provider,
      });
  
      await newUser.save();
      res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
router.post("/signup", async (req, res) => {
    try {
      const { name, email, password,active } = req.body;
  
      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name,active, email, password: hashedPassword });
      await user.save();
  
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          id: user._id,
          name: user.name, 
          email: user.email,
          role: user.role,
        } 
      });
    } catch (error) {
      console.error("Signup error:", error);
      
      res.status(500).json({ error: "Internal server error" });
    }
  });

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid email or password" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  console.log("Login successful:", user._id, token);
  res.json({ token, user: {id: user._id, name: user.name, email } });
});

module.exports = router;