const express = require('express');
const router = express.Router();

const plantsController = require('../controllers/plantsController.js');
const userController = require('../controllers/userController');
router.get('/', plantsController.readAllPlants);
router.post('/:id/buy', userController.validateUser,plantsController.readPlantById , plantsController.buyPlants);
router.get('/:id/', plantsController.ownedPlantsById);
module.exports = router;