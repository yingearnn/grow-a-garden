const express = require('express');
const router = express.Router();

const plantsController = require('../controllers/plantsController.js');
const userController = require('../controllers/userController');
const toolsController = require('../controllers/toolsController');

// Get all tools (for shop display)
router.get('/', toolsController.getAllTools);

// Buy a tool
router.post('/:id/buy', userController.validateUser, toolsController.selectToolsById, toolsController.buyTools);


module.exports = router;