const express = require('express');
const router = express.Router();

const challengesController = require('../controllers/challengesController');
const completionController = require('../controllers/completionController');
const userController = require('../controllers/userController');
const gardenController = require('../controllers/gardenController');

router.post("/plant", gardenController.plant);
router.post(
    "/plant",
    checkInventory,
    checkPlot,
    removeFromInventory,
    plantIntoPlot
);

router.post(
    "/sell",
    readPlantedPlot,
    clearGardenPlot,
    sellPlant
);

module.exports = router;