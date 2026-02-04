const express = require('express');
const router = express.Router();

const challengesController = require('../controllers/challengesController');
const completionController = require('../controllers/completionController');
const userController = require('../controllers/userController');
router.post('/', challengesController.readLatestChallenge , challengesController.createNewChallenge);
router.get('/', challengesController.readAllChallenges);
router.delete('/:id', challengesController.getChallengeById,userController.validateUser,challengesController.deleteChallengesById);
router.put( "/:id", challengesController.getChallengeById,userController.validateUser,challengesController.updateChallengesById
);
router.post(
  '/:id/complete',
  challengesController.getChallengeById,
  userController.validateUser,
  completionController.createNewRecord,
  completionController.updateUserPoints  // Removed gettingPoints middleware - bonus is calculated in createNewRecord
);
router.get('/:id/', completionController.getUserCompletionById);
module.exports = router;