const userModel = require("../models/userModel.js");
const gardenModel = require("../models/gardenModel.js");

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
                return res.status(200).json(results);



        }
    }

    userModel.selectById(data, callback);
}

// Create a new user
module.exports.createNewUser = (req, res, next) => {

    // 1. Validate input
    if (!req.body || !req.body.username || !req.body.password ||!req.body.email) {
        return res.status(400).json({
            message: "Username,password or email is missing"
        });
    }

    // 2. Prepare data (password already hashed)
    const data = {
        username: req.body.username,
        email:req.body.email,
        password: res.locals.hash
    };

    // 3. Insert user
    const callback = (error, results) => {
        if (error) {

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Username or email is already taken"
                });
            }

            console.error("Error createNewUser:", error);
            return res.status(500).json(error);
        }

        // 4. Initialize garden plots for new user
        const userId = results.insertId;
        const plotData = { user_id: userId };
        
        gardenModel.initializePlotsForUser(plotData, (plotError) => {
            if (plotError) {
                console.error("Error initializing plots:", plotError);
                // Continue anyway - plots can be created later
            } else {
                console.log(`Garden plots initialized for user ${userId}`);
            }
        });

        // 5. Pass userId to JWT middleware
        res.locals.user_id = userId;
        res.locals.message = "Registration successful";
        next();
    };

    userModel.insertSingle(data, callback);
};



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
            else {
               req.user = results[0];
               return next();
            }
        }
    }

    userModel.selectById(data, callback);
}

module.exports.login = (req, res, next) => {
    try { 
        const requiredFields = ['username', 'password'];

        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === "") {
                res.status(400).json({ message: `${field} is undefined or empty` });
                return;
            }
        };

        const data = {
            username: req.body.username,
            password: res.locals.hash
        };

        const callback = (error, results) => {
            if(error){
                console.error("Error login callback: ", error);
                res.status(500).json(error);
            } else {
                if(results.length == 0){
                    res.status(404).json({message: "User not found"}); 
                } else {
                    res.locals.user_id = results[0].user_id
                    res.locals.hash = results[0].password
                    next();
                }
            }
        };

        userModel.login(data, callback);

    } catch (error) {
        console.error("Error login: ", error);
        res.status(500).json(error);
    }
};