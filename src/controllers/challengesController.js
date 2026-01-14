
const challengesModel = require("../models/challengesModel.js");

// Creates a new challenge. Checks request body and returns the newly created challenge info.
module.exports.createNewChallenge = (req, res, next) =>

{
    
    if(req.body.user_id == undefined || req.body.description == undefined || req.body.points == undefined)
    {
       return res.status(400).json({message: "User_id or description or points is undefined"});
        
    }                                                      

    const data = {
      user_id: req.body.user_id,
      description: req.body.description,
      points: req.body.points
    }

    const callback = (error, results, fields) => {
        if (error) {

            console.error("Error createNewChallenge:", error);
           return res.status(500).json(error);
        } 
         // Successfully created challenge, returns it with info
        else {
            return res.status(201).json({
                challenge_id: results.insertId,
               description: data.description,
               creator_id : data.user_id,
                points: data.points

            });
        }
    }

    challengesModel.insertChallenge(data, callback);
}

// Retrieves all challenges from database
module.exports.readAllChallenges = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllChallenges:", error);
          return res.status(500).json(error);
        } 
        else
         return res.status(200).json(results);
    }

    challengesModel.selectAll(callback);
}
// Deletes a challenge by ID
module.exports.deleteChallengesById = (req, res, next) => {
    const data = {
        id: req.params.id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error deleteChallengeById:", error);
           return res.status(500).json(error);
        } else {
            const userCompletionResult = results[0]; // first DELETE
            const challengeResult = results[1]; // second DELETE
            if(challengeResult.affectedRows === 0) 
            {
               return res.status(404).json({
                    message: "Challenge not found"
                });
            }
            else
                 // Successfully deleted, no content returned
                return res.status(204).send();            
        }
    }

    challengesModel.deleteChallengesById(data, callback);

}
// Middleware: Get challenge by ID for further operations
module.exports.getChallengeById = (req, res, next) => {   
    const data = {
        challenge_id: req.params.id
    }
    
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readChallengeById:", error);
            return res.status(500).json(error);
        } else {
            if(results.length == 0) {
                return res.status(404).json({
                    message: "Challenge not found"
                });
            }
             // Attach challenge to request for next middleware
            req.challenge = results[0];
            return next();
        }
    }
    
    challengesModel.getChallengeById(data, callback);
}

// Updates a challenge. Checks creator authorization
module.exports.updateChallengesById = (req, res, next) =>
{
     // Checks request body
    if(req.body.user_id == undefined || req.body.points == undefined || req.body.description == undefined)
    {
        return res.status(400).json({
            message: "User_id or description or points is undefined"
        });
      
    }

   
    const challenge = req.challenge;

   // Ensure requester is the creator of the challenge
    if (challenge.creator_id != req.body.user_id) {
         return res.status(403).json({
            message: "You are not the creator of this challenge"
        });
        
    }

    const data = {
        challenge_id: challenge.challenge_id,
        user_id: req.body.user_id,
        description: req.body.description,
        points: req.body.points
    }
 
    const callback = (error, results, fields) => {

        if (error) {
            console.error("Error updateChallengeById:", error);
           return res.status(500).json(error);
        } 
        else {

           return res.status(200).json({
     challenge_id: challenge.challenge_id,
     creator_id: data.user_id,
     description: data.description,
     points: data.points
});
        }
    }

    challengesModel.updateChallengesById(data, callback);
}


