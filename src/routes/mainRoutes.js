// Import express and create main router
const express = require('express');
const router = express.Router();

// Import route modules for different features
const userRoutes = require('./userRoutes');
const challengesRoutes = require('./challengesRoutes');
const plantsRoutes = require('./plantsRoutes');
const toolsRoutes = require('./toolsRoutes');
const gardenRoutes = require('./gardenRoutes');

// Import middlewares for authentication and password handling
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const bcryptMiddleware = require('../middlewares/bcryptMiddleware');

// Import controller for user-related logic
const userController = require('../controllers/userController');

// Mount feature routes
// These define the base paths for each module
router.use("/user", userRoutes);
router.use("/challenges", challengesRoutes);
router.use("/plants", plantsRoutes);
router.use("/tools", toolsRoutes);
router.use("/garden", gardenRoutes);

// Login route
// Flow:
// 1) userController.login -> retrieves user by username
// 2) bcryptMiddleware.comparePassword -> checks password hash
// 3) jwtMiddleware.generateToken -> creates JWT token
// 4) jwtMiddleware.sendToken -> sends token to frontend
router.post(
  "/login",
  userController.login,
  bcryptMiddleware.comparePassword,
  jwtMiddleware.generateToken,
  jwtMiddleware.sendToken
);

// Register route
// Flow:
// 1) bcryptMiddleware.hashPassword -> hash user password
// 2) userController.createNewUser -> save user in database
// 3) jwtMiddleware.generateToken -> create JWT token
// 4) jwtMiddleware.sendToken -> send token to frontend
router.post(
  "/register",
  bcryptMiddleware.hashPassword,
  userController.createNewUser,
  jwtMiddleware.generateToken,
  jwtMiddleware.sendToken
);

// Export router to be used in app.js
module.exports = router;
