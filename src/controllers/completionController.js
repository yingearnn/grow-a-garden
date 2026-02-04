//////////////////////////////////////////////////////
// completionController.js
// Handles challenge completion records + awarding points
//////////////////////////////////////////////////////

// Import completion-related database functions
const completionModel = require("../models/completionModel.js");

//////////////////////////////////////////////////////
// Records a completion for a user on a challenge
// Flow:
// - req.challenge set by challenge middleware
// - req.user set by authentication middleware
// - Inserts completion record
// - Calculates awarded points
// - Passes data to updateUserPoints middleware
//////////////////////////////////////////////////////
module.exports.createNewRecord = (req, res, next) => {

  // Challenge object fetched earlier
  const completedChallenge = req.challenge;

  // Logged-in user object validated earlier
  const existUser = req.user;

  // Ensure challenge exists
  if (!completedChallenge) {
    return res.status(404).json({ message: "Challenge not found" });
  }

  // Ensure user is authenticated
  if (!existUser) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // Validate completion details input
  if (req.body.details === undefined || req.body.details.trim() === "") {
    return res.status(400).json({ message: "Details is missing" });
  }

  //////////////////////////////////////////////////////
  // Cooldown logic: prevent user from completing same
  // challenge more than once every 24 hours
  //////////////////////////////////////////////////////
  completionModel.getUserCompleteById(
    { id: completedChallenge.challenge_id },
    (error, results) => {

      if (error) {
        console.error("Error getUserCompleteById:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      // Find latest completion by this user
      const lastCompletion = results.find(
        (r) => r.user_id === existUser.user_id
      );

      if (lastCompletion) {
        const lastTime = new Date(lastCompletion.completed_on);
        const now = new Date();

        // 24-hour cooldown check
        if (now - lastTime < 24 * 60 * 60 * 1000) {
          return res.status(400).json({
            message: "Challenge can be completed once every 24 hours"
          });
        }
      }

      //////////////////////////////////////////////////////
      // Bonus points logic (time-based multiplier)
      //////////////////////////////////////////////////////

      // Get current hour (0–23)
      const hour = new Date().getHours();

      // Bonus window (example: 10am–12pm)
      const hasBonus = hour >= 10 && hour < 12;

      // Apply multiplier if in bonus time
      const bonusMultiplier = hasBonus ? 1.5 : 1;

      // Calculate final awarded points (rounded down)
      const pointsAwarded = Math.floor(
        completedChallenge.points * bonusMultiplier
      );

      //////////////////////////////////////////////////////
      // Prepare completion record for insertion
      //////////////////////////////////////////////////////
      const data = {
        user_id: existUser.user_id,
        challenge_id: completedChallenge.challenge_id,
        details: req.body.details
      };

      //////////////////////////////////////////////////////
      // Insert completion into database
      //////////////////////////////////////////////////////
      completionModel.insertCompletion(data, (insertErr, insertResults) => {

        if (insertErr) {
          console.error("Error insertCompletion:", insertErr);
          return res.status(500).json({ message: "Internal server error" });
        }

        // Store values for next middleware
        req.complete_id = insertResults.insertId;
        req.challenge_id = completedChallenge.challenge_id;
        req.user_id = existUser.user_id;
        req.details = req.body.details;
        req.points = pointsAwarded;

        // Continue to updateUserPoints middleware
        return next();
      });
    }
  );
};

//////////////////////////////////////////////////////
// Updates user's points after challenge completion
//////////////////////////////////////////////////////
module.exports.updateUserPoints = (req, res, next) => {

  // Prepare data for point update
  const data = {
    user_id: req.user_id,
    points: req.points
  };

  // Update user's points in database
  completionModel.updatePoints(data, (error, results) => {

    if (error) {
      console.error("Error updatePoints:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    // If no rows updated, user not found
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return successful completion response
    return res.status(200).json({
      complete_id: req.complete_id,
      challenge_id: req.challenge_id,
      user_id: req.user_id,
      details: req.details,
      points_awarded: req.points
    });
  });
};

//////////////////////////////////////////////////////
// Retrieve all users who completed a challenge
//////////////////////////////////////////////////////
module.exports.getUserCompletionById = (req, res, next) => {

  // Challenge ID from route parameter
  const data = { id: req.params.id };

  // Query database for completion records
  completionModel.getUserCompleteById(data, (error, results) => {

    if (error) {
      console.error("Error getUserCompletionById:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    // Return list of users who completed challenge
    return res.status(200).json(results);
  });
};
