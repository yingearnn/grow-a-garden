const express = require('express');
const router = express.Router();

const challengesController = require('../controllers/challengesController');
const completionController = require('../controllers/completionController');
const userController = require('../controllers/userController');
router.post('/', challengesController.createNewChallenge);
router.get('/', challengesController.readAllChallenges);
router.delete('/:id', challengesController.deleteChallengesById);
router.put( "/:id", challengesController.getChallengeById,challengesController.updateChallengesById
);
router.post(
  '/:id/complete',   // ✅ add "complete" here so it matches frontend
  challengesController.getChallengeById,
  userController.validateUser,
  completionController.createNewRecord,
  completionController.gettingPoints,
  completionController.updateUserPoints
);
router.get('/:id/', completionController.getUserCompletionById);
module.exports = router;