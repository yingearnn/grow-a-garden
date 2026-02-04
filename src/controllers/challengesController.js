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
    // NOTE: req.user_id is set by readLatestChallenge middleware
    if (req.user_id == undefined || req.body.description == undefined || req.body.points == undefined) {
        return res.status(400).json({ message: "Description or points is undefined" });
    }

    // Prepare data for DB insert
    const data = {
        user_id: req.user_id,           // Creator user id (from middleware)
        description: req.body.description,
        points: req.body.points
    }

    // Enforce maximum challenge points
    if (data.points > 50) {
        return res.status(403).json({
            message: "Maximum 50 points for challenge"
        });
    }

    // Cooldown check: allow creating a new challenge only every 12 hours
    if (req.latestChallengeTime != undefined) {
        const lastCreated = new Date(req.latestChallengeTime);
        const now = new Date();

        if (now - lastCreated < 12 * 60 * 60 * 1000) {
            return res.status(400).json({
                message: "You can only create a new challenge once every 12 hours"
            });
        }
    }

    // Callback after DB insert finishes
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error createNewChallenge:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
        else {
            // Return newly created challenge info
            // NOTE: results[0].insertId suggests stored procedure return format
            return res.status(201).json({
                challenge_id: results[0].insertId,
                description: data.description,
                creator_id: data.user_id,
                points: data.points
            });
        }
    }

    // Insert challenge into database
    challengesModel.insertChallenge(data, callback);
}


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
module.exports.readLatestChallenge = (req, res, next) =>
{
    // NOTE: user ID is coming from res.locals.userId (set by JWT middleware)
    const data = {
        user_id: res.locals.userId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllChallenges:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // If user has a previous created challenge, store its time
        // NOTE: results[1] suggests stored procedure result format
        if (results[1] && results[1].length > 0) {
            req.latestChallengeTime = results[1][0].created_on;
            req.user_id = data.user_id;
            return next();
        } else {
            // If first-time creator, no cooldown time needed
            req.user_id = data.user_id;
            return next();
        }
    }

    // Query DB for latest challenge by user
    challengesModel.selectLatest(data, callback);
}


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
module.exports.updateChallengesById = (req, res, next) =>
{
    // Validate required fields in body
    if (req.body.user_id == undefined || req.body.points == undefined || req.body.description == undefined) {
        return res.status(400).json({
            message: "User_id or description or points is undefined"
        });
    }

    const challenge = req.challenge; // Set by getChallengeById middleware

    // Authorization: only creator can update
    if (challenge.creator_id != req.body.user_id) {
        return res.status(403).json({
            message: "You are not the creator of this challenge"
        });
    }

    // Prepare update data
    const data = {
        challenge_id: challenge.challenge_id,
        user_id: req.body.user_id,
        description: req.body.description,
        points: req.body.points
    }

    // Callback after update finishes
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updateChallengeById:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
        else {
            // Return updated challenge data
            return res.status(200).json({
                challenge_id: challenge.challenge_id,
                creator_id: data.user_id,
                description: data.description,
                points: data.points
            });
        }
    }

    // Execute DB update
    challengesModel.updateChallengesById(data, callback);
}
