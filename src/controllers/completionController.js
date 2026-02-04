//////////////////////////////////////////////////////
// completionController.js
// Handles challenge completion records + awarding points
//////////////////////////////////////////////////////

const completionModel = require("../models/completionModel.js");

//////////////////////////////////////////////////////
// Records a completion for a user on a challenge
// Route usage (your challengesRoutes.js):
// POST /challenges/:id/complete
// Middlewares before this should set:
// - req.challenge (challenge object)
// - req.user (validated user object from token)
// Then this controller inserts completion + sets req.points
//////////////////////////////////////////////////////
module.exports.createNewRecord = (req, res, next) => {
  const completedChallenge = req.challenge; // set by challengesController.getChallengeById
  const existUser = req.user; // set by userController.validateUser

  // Safety check: challenge exists
  if (!completedChallenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  // Safety check: user exists (should already be set by validateUser)
  if (!existUser) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // Validate required field
  if (req.body.details === undefined || req.body.details.trim() === "") {
    return res.status(400).json({ message: "Details is missing" });
  }

  //////////////////////////////////////////////////////
  // Cooldown check: user can complete same challenge only once every 24 hours
  //////////////////////////////////////////////////////
  completionModel.getUserCompleteById({ id: completedChallenge.challenge_id }, (error, results) => {
    if (error) {
      console.error("Error getUserCompleteById:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    // Find last completion by this user
    const lastCompletion = results.find((r) => r.user_id === existUser.user_id);

    if (lastCompletion) {
      const lastTime = new Date(lastCompletion.completed_on);
      const now = new Date();

      // 24 hour cooldown
      if (now - lastTime < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: "Challenge can be completed once every 24 hours" });
      }
    }

    //////////////////////////////////////////////////////
    // Time-based bonus
    // Example: 2pm-3pm (14:00-15:00) gives 1.5x points
    //////////////////////////////////////////////////////
    const hour = new Date().getHours();
    const hasBonus = hour >= 14 && hour < 15; // 14:00 to 14:59
    const bonusMultiplier = hasBonus ? 1.5 : 1;

    // Calculate awarded points (integer)
    const pointsAwarded = Math.floor(completedChallenge.points * bonusMultiplier);

    // Data to insert completion record (UserCompletion table has no points column)
    const data = {
      user_id: existUser.user_id,
      challenge_id: completedChallenge.challenge_id,
      details: req.body.details,
    };

    //////////////////////////////////////////////////////
    // Insert completion record
    //////////////////////////////////////////////////////
    completionModel.insertCompletion(data, (insertErr, insertResults) => {
      if (insertErr) {
        console.error("Error insertCompletion:", insertErr);
        return res.status(500).json({ message: "Internal server error" });
      }

      // Pass info forward to updateUserPoints middleware
      req.complete_id = insertResults.insertId;
      req.challenge_id = completedChallenge.challenge_id;
      req.user_id = existUser.user_id;
      req.details = req.body.details;
      req.points = pointsAwarded;

      return next();
    });
  });
};

//////////////////////////////////////////////////////
// Updates user's points after completion
// Uses req.user_id + req.points set by createNewRecord
//////////////////////////////////////////////////////
module.exports.updateUserPoints = (req, res, next) => {
  const data = {
    user_id: req.user_id,
    points: req.points,
  };

  completionModel.updatePoints(data, (error, results) => {
    if (error) {
      console.error("Error updatePoints:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return a clean success payload (frontend can show points awarded)
    return res.status(200).json({
      complete_id: req.complete_id,
      challenge_id: req.challenge_id,
      user_id: req.user_id,
      details: req.details,
      points_awarded: req.points,
    });
  });
};

//////////////////////////////////////////////////////
// Retrieve users who completed a challenge
// (Leaving the rest of your file intact if you still use it)
//////////////////////////////////////////////////////
module.exports.getUserCompletionById = (req, res, next) => {
  const data = { id: req.params.id };

  completionModel.getUserCompleteById(data, (error, results) => {
    if (error) {
      console.error("Error getUserCompletionById:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(results);
  });
};
