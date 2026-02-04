// Import express and create router for user-related routes
const express = require('express');
const router = express.Router();

// Middleware to verify JWT token (user must be logged in)
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// Import controller for user logic
const userController = require('../controllers/userController');

// Apply JWT verification to ALL user routes
// Ensures only authenticated users can access user data
router.use(jwtMiddleware.verifyToken);

// Retrieve top 10 users (for leaderboard display)
router.get('/top10', userController.readTop10);

// Retrieve all users (admin-style or general listing)
router.get('/', userController.readAllUser);

// Create a new user
// (Typically used during registration process)
router.post('/', userController.createNewUser);

// Retrieve a specific user by ID
router.get('/:id', userController.readUserById);

// Update user by ID (currently not used)
// router.put('/:id', userController.updateUserById);

// Export router to be mounted in main routes file
module.exports = router;
