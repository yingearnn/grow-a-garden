const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middlewares/jwtMiddleware');

const userController = require('../controllers/userController');
const plantsController = require('../controllers/plantsController');

// Apply JWT verification to ALL user routes
router.use(jwtMiddleware.verifyToken);

router.get('/top10', userController.readTop10);
router.get('/', userController.readAllUser);
router.post('/', userController.createNewUser);
router.get('/:id', userController.readUserById);
router.put('/:id', userController.updateUserById);

module.exports = router;