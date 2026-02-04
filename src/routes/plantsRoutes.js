const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middlewares/jwtMiddleware');

const plantsController = require('../controllers/plantsController.js');
const userController = require('../controllers/userController');

// Apply JWT verification to ALL plant routes
router.use(jwtMiddleware.verifyToken);

router.get('/', plantsController.readAllPlants);
router.post('/:id/buy', userController.validateUser, plantsController.readPlantById, plantsController.buyPlants);
router.get('/:id/', plantsController.ownedPlantsById);

module.exports = router;