const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const userController = require('../controllers/userController');
const toolsController = require('../controllers/toolsController');
router.use(jwtMiddleware.verifyToken);

// Get all tools (for shop display)
router.get('/', toolsController.getAllTools);
// Buy a tool
router.post('/:id/buy', userController.validateUser, toolsController.selectToolsById, toolsController.buyTools);


module.exports = router;