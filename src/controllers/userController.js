const userModel = require("../models/userModel.js");
// Retrieve all users
module.exports.readAllUser = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllUser:", error);
           return res.status(500).json(error);
        } 
        else return res.status(200).json(results);
    }

    userModel.selectAll(callback);
}


// Retrieve a single user by ID
module.exports.readUserById = (req, res, next) =>
{
    const data = {
        user_id: req.params.id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readUserById:", error);
             return res.status(500).json(error);
        } else {
            if(results.length == 0) 
            {
               return res.status(404).json({
                    message: "User not found"
                });
            }
            else 
                return res.status(200).json(results[0]);



        }
    }

    userModel.selectById(data, callback);
}

// Create a new user
module.exports.createNewUser = (req, res, next) =>

{ 
       if(!req.body || !req.body.username)
    {
        res.status(400).json({message : "Username is missing"});
        return;
    }

    const data = {
        username: req.body.username,
    }

                                                    
 
    const callback = (error, results, fields) => {
        if (error) {

               if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Username is already taken"
                });
            }

            
            console.error("Error createNewUser:", error);
           return res.status(500).json(error);
        } 
        
        else {
           return res.status(201).json({
                user_id: results.insertId,
                username: data.username,
                points: 0

            });
        }
    }

    userModel.insertSingle(data, callback);
}
// Update user info
module.exports.updateUserById = (req, res, next) =>
{
    if(req.body.username == undefined)
    {
       return res.status(400).json({
            message: "Username is missing"
        });
       
    }

    const data = {
        user_id: req.params.id,
        username:req.body.username,
        points: req.body.points
    }

    const callback = (error, results, fields) => {

        
        if (error) {
               if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Username is already taken"
                });
            }
            console.error("Error updateUserById:", error);
           return res.status(500).json(error);
        } else {
            if(results.affectedRows == 0) 
            {
               return res.status(404).json({
                    message: "User not found"
                });
            }
            else 
               return res.status(200).json({
                user_id: data.user_id,
                username: data.username,
                points: data.points

            });
        }
    }

    userModel.updateUserById(data, callback);
}
// Middleware: Validate user exists
module.exports.validateUser = (req, res, next) =>
{
    const data = {
        user_id: req.body.user_id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readUserById:", error);
          return res.status(500).json(error);
        } else {
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            else 
               req.user = results[0]
               return next();



        }
    }

    userModel.selectById(data, callback);
}