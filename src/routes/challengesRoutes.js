// Import express and create router for challenge-related routes
const express = require('express');
const router = express.Router();

// Middleware to verify JWT token for protected routes
const jwtMiddleware = require('../middlewares/jwtMiddleware');

// Import controllers that handle business logic
const challengesController = require('../controllers/challengesController');
const completionController = require('../controllers/completionController');
const userController = require('../controllers/userController');

// Apply JWT verification to ALL challenge routes
// This ensures users must be logged in before accessing any endpoint below
router.use(jwtMiddleware.verifyToken);

// Create a new challenge
// readLatestChallenge can be used to check rules before creation
// createNewChallenge inserts the challenge into the database
router.post(
  '/',
  challengesController.readLatestChallenge,
  challengesController.createNewChallenge
);

// Retrieve all challenges
router.get('/', challengesController.readAllChallenges);

// Delete a challenge (only creator allowed)
// getChallengeById fetches the challenge and attaches it to req.challenge
// validateUser checks if the logged-in user is the creator
// deleteChallengesById removes it from database
router.delete(
  '/:id',
  challengesController.getChallengeById,
  userController.validateUser,
  challengesController.deleteChallengesById
);

// Update a challenge (only creator allowed)
// getChallengeById fetches challenge
// validateUser ensures ownership
// updateChallengesById updates DB record
router.put(
  '/:id',
  challengesController.getChallengeById,
  userController.validateUser,
  challengesController.updateChallengesById
);

// Complete a challenge and award points
// getChallengeById gets challenge info
// validateUser confirms user
// createNewRecord inserts completion record + calculates bonus
// updateUserPoints updates user's points balance
router.post(
  '/:id/complete',
  challengesController.getChallengeById,
  userController.validateUser,
  completionController.createNewRecord,
  completionController.updateUserPoints
);

// Retrieve completion records for a specific challenge
// Used to display completed challenges in frontend
router.get('/:id/', completionController.getUserCompletionById);

// Export router to be used in main app
module.exports = router;
