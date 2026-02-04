const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middlewares/jwtMiddleware');

const challengesController = require('../controllers/challengesController');
const completionController = require('../controllers/completionController');
const userController = require('../controllers/userController');

// Apply JWT verification to ALL challenge routes
router.use(jwtMiddleware.verifyToken);

router.post('/', challengesController.readLatestChallenge, challengesController.createNewChallenge);
router.get('/', challengesController.readAllChallenges);
router.delete('/:id', challengesController.getChallengeById, userController.validateUser, challengesController.deleteChallengesById);
router.put('/:id', challengesController.getChallengeById, userController.validateUser, challengesController.updateChallengesById);
router.post('/:id/complete', challengesController.getChallengeById, userController.validateUser, completionController.createNewRecord, completionController.updateUserPoints);
router.get('/:id/', completionController.getUserCompletionById);

module.exports = router;