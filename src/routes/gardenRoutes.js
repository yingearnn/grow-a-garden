const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middlewares/jwtMiddleware');

const gardenController = require('../controllers/gardenController');

// Apply JWT verification to ALL garden routes
router.use(jwtMiddleware.verifyToken);

// Now all routes below are protected
router.get('/:userId', gardenController.getGardenPlots);

//plant from inventory into plot
router.post(
    '/plant',
    gardenController.checkInventory,
    gardenController.checkPlot,
    gardenController.plantIntoPlot,
    gardenController.markAsPlanted
);

//sell a planted plant
router.post(
    '/sell',
    gardenController.readPlantedPlot,
    gardenController.clearGardenPlot,
    gardenController.sellPlant
);

module.exports = router;