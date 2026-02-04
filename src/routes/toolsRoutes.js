// Import express and create router for tool-related routes
const express = require('express');
const router = express.Router();

// Middleware to verify JWT token (user must be logged in)
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// Import controllers for user and tool logic
const userController = require('../controllers/userController');
const toolsController = require('../controllers/toolsController');

// Apply JWT verification to ALL tool routes
// Ensures only authenticated users can access shop and buy tools
router.use(jwtMiddleware.verifyToken);

// Retrieve all tools for shop display
router.get('/', toolsController.getAllTools); // DONE

// Buy a tool
// Flow:
// 1) validateUser -> confirms logged-in user
// 2) selectToolsById -> fetch tool information
// 3) buyTools -> deduct points and add tool to user's inventory
router.post(
  '/:id/buy',
  userController.validateUser,
  toolsController.selectToolsById,
  toolsController.buyTools
); //DONE

// Export router to be mounted in main routes file
module.exports = router;
