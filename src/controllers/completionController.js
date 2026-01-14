const completionModel = require("../models/completionModel.js");
// Records a completion for a user on a challenge
module.exports.createNewRecord = (req, res, next) =>

{
    const completedChallenge = req.challenge
    const existUser = req.user
    // Ensure challenge exists
     if (!req.challenge) {
        return res.status(404).json({
            message: "Challenge not found"
        });
    }
    
    // Validate request body
    if(req.body.details == undefined) {
        return res.status(400).json({ message: "Details is missing" });
    }
                                                         

    const data = {
      user_id: existUser.user_id,
      challenge_id: completedChallenge.challenge_id,
      details: req.body.details

    } 
   
    // Insert completion into database
    const callback = (error, results, fields) => {
        if (error) {

            console.error("Error recordCompleted:", error);
            return res.status(500).json(error);
        } 
           // Attach info for next middleware
        else {

     req.complete_id = results.insertId;
     req.challenge_id = completedChallenge.challenge_id;
     req.user_id = existUser.user_id;
     req.details = req.body.details;
           return next();
        }
    }

    completionModel.insertCompletion(data, callback);
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
              return res.status(500).json(error);
          } else {
              if(results.length == 0) 
              {
                 return res.status(404).json({
                      message: "User completion not found"
                  });
              }
              else {
               return res.status(200).json(results);
           
              }
          }
      }
  
      completionModel.getUserCompleteById(data, callback);
}
// Middleware: Get points of a challenge to reward user
module.exports.gettingPoints = (req, res, next) =>
{


  const data = {
          id: req.challenge_id
      }

    const callback = (error, results, fields) => {

        if (error) {
            console.error("Error select points error:", error);
           return res.status(500).json(error);
        } 

           if (results.length === 0) {
      return res.status(404).json({
        message: "Challenge not found"
      });
    }
        
         req.points = results[0].points
         return next();
           
        
    }

    completionModel.getPoints(data, callback);
}
// Middleware: Update user points after completing challenge
module.exports.updateUserPoints = (req, res, next) =>

{

    const data = {
        user_id:req.user_id ,
        points:req.points
    }

    const callback = (error, results, fields) => {

       

     if (error) {
            console.error("Error updatePoints:", error);
           return res.status(500).json(error);
        } 

          if(results.affectedRows == 0) 
            {
               return res.status(404).json({
                    message: "User not found"
                });
            }
            
            return  res.status(200).json({
                
             complete_id:  req.complete_id ,
             challenge_id: req.challenge_id,
             user_id: req.user_id,
             details:req.details


            });
        
    }

    completionModel.updatePoints(data, callback);
}