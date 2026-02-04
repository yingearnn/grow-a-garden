const completionModel = require("../models/completionModel.js");
// Records a completion for a user on a challenge
module.exports.createNewRecord = (req, res, next) => {

    const completedChallenge = req.challenge;
    const existUser = req.user;

    if (!completedChallenge) {
        return res.status(404).json({
            message: "Challenge not found"
        });
    }

    if(req.body.details == undefined) {
        return res.status(400).json({ message: "Details is missing" });
    }

    // Check cooldown: has user already completed this challenge recently?
    completionModel.getUserCompleteById({ id: completedChallenge.challenge_id }, (error, results) => {
        if (error)  return res.status(500).json({
            message: "Internal server error"
        });

        const lastCompletion = results.find(r => r.user_id === existUser.user_id);

        if (lastCompletion) {
            const lastTime = new Date(lastCompletion.completed_on);
            const now = new Date();
            // 24 hour cooldown
            if (now - lastTime < 24 * 60 * 60 * 1000) {
                return res.status(400).json({ message: "Challenge can be completed once every 24 hours" });
            }
        }

        // Time-based bonus: 2pm-3pm (14:00-15:00) = 1.5x points
       const hour = new Date().getHours();
const hasBonus = hour >= 10 && hour < 12;

const bonusMultiplier = hasBonus ? 1.5 : 1;

        // Calculate points with bonus
        const pointsAwarded = Math.floor(completedChallenge.points * bonusMultiplier);

        const data = {
            user_id: existUser.user_id,
            challenge_id: completedChallenge.challenge_id,
            details: req.body.details,
            points: pointsAwarded
        };

        const callback = (error, results, fields) => {
            if (error) {
                console.error("Error recordCompleted:", error);
                return res.status(500).json({
            message: "Internal server error"
        });
            } else {
                req.complete_id = results.insertId;
                req.challenge_id = completedChallenge.challenge_id;
                req.user_id = existUser.user_id;
                req.details = req.body.details;
                req.points = pointsAwarded; // Use the calculated points with bonus
                
                return next();
            }
        }

        completionModel.insertCompletion(data, callback);
    });
}
// Retrieve users who completed a challenge
module.exports.getUserCompletionById = (req, res, next) =>
{   
  const data = {
          id: req.params.id
      }
  
      const callback = (error, results, fields) => {
          if (error) {
              console.error("Error readUsersByChallengeId:", error);
               return res.status(500).json({
            message: "Internal server error"
        });
          } else {
              if(results.length == 0) 
              {
                 return res.status(404).json({
                      message: "You have not completed any challenge"
                  });
              }
              else {
               return res.status(200).json(results);
           
              }
          }
      }
  
      completionModel.getUserCompleteById(data, callback);
}
// Middleware: Update user points after completing challenge
module.exports.updateUserPoints = (req, res, next) => {

    const data = {
        user_id: req.user_id,
        points: req.points // This now has the bonus multiplier applied
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error updatePoints:", error);
            return res.status(500).json({
            message: "Internal server error"
        });
        }

        if(results.affectedRows == 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            complete_id:  req.complete_id,
            challenge_id: req.challenge_id,
            user_id: req.user_id,
            details: req.details,
            points_awarded: req.points
        });

    }

    completionModel.updatePoints(data, callback);
}