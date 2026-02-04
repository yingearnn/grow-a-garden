// Import challenge-related database functions
const challengesModel = require("../models/challengesModel.js");

// =========================
// Create a new challenge
// - Validates request body
// - Enforces max points limit
// - Enforces cooldown (12 hours between challenge creations)
// - Inserts challenge into DB
// =========================
module.exports.createNewChallenge = (req, res, next) => {
  // Validate required fields
  if ( req.body.description === undefined || req.body.points === undefined) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const description = String(req.body.description).trim();
  const points = Number(req.body.points);

  if(req.user.points < 10){
     return res.status(400).json({ message: "Insufficient points to create new challenge" });
  }

   if (!Number.isInteger(points)) {
    return res.status(400).json({ message: "Points must be a whole number" });
  }

  // Validate values properly
  if (!description || Number.isNaN(points)) {
    return res.status(400).json({ message: "Description or points is invalid" });
  }

  // Enforce 1–50 range
  if (points < 1 || points > 50) {
    return res.status(400).json({ message: "Points must be between 1 and 50" });
  }

  // Cooldown check (12 hours)
  if (req.latestChallengeTime !== undefined) {
    const lastCreated = new Date(req.latestChallengeTime);
    const now = new Date();

    if (now - lastCreated < 12 * 60 * 60 * 1000) {
      return res.status(400).json({
        message: "You can only create a new challenge once every 12 hours"
      });
    }
  }

  const data = {
    user_id: req.user.user_id,
    description,
    points
  };

  const callback = (error, results) => {
    if (error) {
      console.error("Error createNewChallenge:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(201).json({
      challenge_id: results[0].insertId,
      description: data.description,
      creator_id: data.user_id,
      points: data.points
    });
  };

  challengesModel.insertChallenge(data, callback);
};



// =========================
// Retrieve all challenges
// - Fetches list from DB
// - Adds bonus fields during bonus time window (10-12)
// =========================
module.exports.readAllChallenges = (req, res, next) =>
{
    const callback = (error, results) => {
        if (error) {
            console.error("Error readAllChallenges:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // Check current time for bonus point period
        const hour = new Date().getHours();
        const isBonusTime = hour >= 10 && hour < 12;

        // Add extra computed fields for frontend
        const formatted = results.map(challenge => {
            const has_bonus = isBonusTime;

            // Apply 1.5x during bonus time
            const effective_points = has_bonus
                ? Math.floor(challenge.points * 1.5)
                : challenge.points;

            return {
                ...challenge,
                has_bonus,
                effective_points
            };
        });

        return res.status(200).json(formatted);
    };

    // Query DB for all challenges
    challengesModel.selectAll(callback);
};


// =========================
// Middleware: Read latest challenge created by this user
// - Used to enforce cooldown for createNewChallenge
// - Sets req.latestChallengeTime and req.user_id
// =========================
module.exports.readLatestChallenge = (req, res, next) => {
  const data = { user_id: res.locals.userId };

  const callback = (error, results) => {
    if (error) {
      console.error("Error readLatestChallenge(log):", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    // results should be a normal array now (NOT results[1])
    if (results && results.length > 0) {
      req.latestChallengeTime = results[0].created_on;
    } else {
      req.latestChallengeTime = undefined;
    }

    return next();
  };

  challengesModel.selectLatestCreateLog(data, callback);
};


// =========================
// Delete a challenge by ID
// - Only creator can delete
// - Deletes completion records + challenge record (based on model)
// =========================
module.exports.deleteChallengesById = (req, res, next) => {

    // Prepare delete data (challenge ID + user ID)
    const data = {
        id: req.challenge.challenge_id,   // From getChallengeById middleware
        userid: req.user.user_id         // From validateUser middleware
    }

    // Authorization: only creator can delete
    if (req.challenge.creator_id != req.user.user_id) {
        return res.status(403).json({
            message: "You are not the creator of this challenge"
        });
    }

    // Callback after DB delete finishes
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error deleteChallengeById:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        } else {
            // results[0] and results[1] likely represent multi-step delete
            // Return 204 No Content on successful delete
            return res.status(204).send();
        }
    }

    // Run deletion logic in DB
    challengesModel.deleteChallengesById(data, callback);
}


// =========================
// Middleware: Get challenge by ID
// - Used before update/delete/complete routes
// - Attaches challenge object to req.challenge
// =========================
module.exports.getChallengeById = (req, res, next) => {
    const data = {
        challenge_id: req.params.id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readChallengeById:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        } else {
            // If challenge doesn't exist
            if (results.length == 0) {
                return res.status(404).json({
                    message: "Challenge not found"
                });
            }

            // Attach challenge record for later middleware/controllers
            req.challenge = results[0];
            return next();
        }
    }

    // Query DB for a single challenge
    challengesModel.getChallengeById(data, callback);
}


// =========================
// Update a challenge by ID
// - Validates request body
// - Only creator can update challenge
// =========================
module.exports.updateChallengesById = (req, res, next) => {
  if (req.body.user_id === undefined || req.body.points === undefined || req.body.description === undefined) {
    return res.status(400).json({ message: "User_id or description or points is undefined" });
  }

  const challenge = req.challenge;

  // Authorization
  if (challenge.creator_id != req.body.user_id) {
    return res.status(403).json({ message: "You are not the creator of this challenge" });
  }

  const description = String(req.body.description).trim();
 const points = Number(req.body.points);

   if (!Number.isInteger(points)) {
    return res.status(400).json({ message: "points must be a whole number" });
  }

  // Validate values properly
  if (!description || Number.isNaN(points)) {
    return res.status(400).json({ message: "Description or points is invalid" });
  }

  // Enforce 1–50 range
  if (points < 1 || points > 50) {
    return res.status(400).json({ message: "Points must be between 1 and 50" });
  }

  const data = {
    challenge_id: challenge.challenge_id,
    user_id: req.body.user_id,
    description,
    points
  };

  const callback = (error) => {
    if (error) {
      console.error("Error updateChallengeById:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(200).json({
      challenge_id: challenge.challenge_id,
      creator_id: data.user_id,
      description: data.description,
      points: data.points
    });
  };

  challengesModel.updateChallengesById(data, callback);
};
