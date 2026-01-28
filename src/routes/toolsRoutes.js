const express = require('express');
const router = express.Router();

const plantsController = require('../controllers/plantsController.js');
const userController = require('../controllers/userController');
const toolsController = require('../controllers/toolsController');

router.post('/:id/buy', userController.validateUser,toolsController.selectToolsById , toolsController.buyTools);

module.exports = router;