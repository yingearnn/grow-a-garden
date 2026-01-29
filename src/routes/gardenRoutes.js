const express = require('express');
const router = express.Router();

const challengesController = require('../controllers/challengesController');
const completionController = require('../controllers/completionController');
const userController = require('../controllers/userController');
const gardenController = require('../controllers/gardenController');

// Get all garden plots for a user
router.get('/:userId', gardenController.getGardenPlots);

// Plant a plant from inventory into a plot
router.post(
    '/plant',
    gardenController.checkInventory,
    gardenController.checkPlot,
    gardenController.plantIntoPlot,
    gardenController.markAsPlanted
    
);

// Sell a planted plant
router.post(
    '/sell',
    gardenController.readPlantedPlot,
    gardenController.clearGardenPlot,
    gardenController.sellPlant
);

module.exports = router;