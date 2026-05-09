const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

//register
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  // Enhanced validation
  if (!userName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please try again later.",
        debug: process.env.NODE_ENV === 'development' ? {
          readyState: mongoose.connection.readyState,
          states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
        } : undefined
      });
    }

    console.log('✅ Database connected. Checking for existing user...');
    
    const checkUser = await User.findOne({ email });
    if (checkUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    console.log('✅ Email available. Hashing password...');
    const hashPassword = await bcrypt.hash(password, 12);
    
    console.log('✅ Password hashed. Creating user...');
    const newUser = new User({
      userName,
      email,
      password: hashPassword,
    });

    console.log('✅ Saving user to database...');
    await newUser.save();
    
    console.log('✅ User registered successfully:', email);
    res.status(201).json({
      success: true,
      message: "Registration successful! Please login to continue.",
    });
  } catch (e) {
    console.error("❌ Registration error:", {
      message: e.message,
      code: e.code,
      name: e.name,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
    
    // Handle specific MongoDB errors
    if (e.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }
    
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error: " + e.message,
      });
    }
    
    if (e.name === 'MongoNetworkError' || e.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again later.",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "An error occurred during registration",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
};

//login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser)
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first",
      });

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (!checkPasswordMatch)
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
      },
      process.env.JWT_SECRET || "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    res.json({
      success: true,
      message: "Logged in successfully",
      token: token,
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
};

//logout

const logoutUser = (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully!",
  });
};

//auth middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CLIENT_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }
};

module.exports = { registerUser, loginUser, logoutUser, authMiddleware };
