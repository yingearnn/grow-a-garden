const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const plantsController = require('../controllers/plantsController');
router.get('/top10', userController.readTop10);
router.get('/', userController.readAllUser);
router.post('/', userController.createNewUser);
router.get('/:id', userController.readUserById);
router.put('/:id', userController.updateUserById);
module.exports = router;