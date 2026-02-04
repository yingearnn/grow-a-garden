// Import express and create router for plant-related routes
const express = require('express');
const router = express.Router();

// Middleware to verify JWT token (user must be logged in)
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// Import controllers for plant and user logic
const plantsController = require('../controllers/plantsController.js');
const userController = require('../controllers/userController');

// Apply JWT verification to ALL plant routes
// Every endpoint below requires a valid token
router.use(jwtMiddleware.verifyToken);

// Retrieve all plants available in the shop
router.get('/', plantsController.readAllPlants);

// Buy a plant
// Flow:
// 1) validateUser -> confirms logged-in user
// 2) readPlantById -> fetch plant info
// 3) buyPlants -> deduct points and add plant to inventory
router.post(
  '/:id/buy',
  userController.validateUser,
  plantsController.readPlantById,
  plantsController.buyPlants
);

// Retrieve plants owned by a specific user
// Used to display inventory
router.get('/:id/', plantsController.ownedPlantsById);

// Export router to be mounted in main routes file
module.exports = router;
