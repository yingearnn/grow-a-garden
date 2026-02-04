// Import database model functions for users
const userModel = require("../models/userModel.js");

// Import garden model to create default plots for new users
const gardenModel = require("../models/gardenModel.js");

// =========================
// Retrieve all users
// =========================
module.exports.readAllUser = (req, res, next) =>
{
    // Callback runs after the DB query finishes
    const callback = (error, results, fields) => {
        if (error) {
            // Log the error for debugging
            console.error("Error readAllUser:", error);

            // Send generic server error to client
            return res.status(500).json({
                message: "Internal server error"
            });
        } 
        // Send list of users back to client
        else return res.status(200).json(results);
    }

    // Call model function to select all users from DB
    userModel.selectAll(callback);
}


// =========================
// Retrieve a single user by ID
// =========================
module.exports.readUserById = (req, res, next) =>
{
    // Extract user id from route parameter (e.g. /users/:id)
    const data = {
        user_id: req.params.id
    }

    // Callback runs after DB query finishes
    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error readUserById:", error);

            // Return server error
            return res.status(500).json({
                message: "Internal server error"
            });
        } else {
            // If no rows returned, user does not exist
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            // Return user record(s)
            else 
                return res.status(200).json(results);
        }
    }

    // Query DB by user id
    userModel.selectById(data, callback);
}

// =========================
// Create a new user (registration)
// =========================
module.exports.createNewUser = (req, res, next) => {

    // 1. Validate required inputs exist in request body
    if (!req.body || !req.body.username || !req.body.password || !req.body.email) {
        return res.status(400).json({
            message: "Username,password or email is missing"
        });
    }

    // 2. Prepare insert data
    // NOTE: password is stored in res.locals.hash (assumes bcrypt hashing middleware ran before this)
    const data = {
        username: req.body.username,
        email: req.body.email,
        password: res.locals.hash
    };

    // 3. Insert user into DB
    const callback = (error, results) => {
        if (error) {

            // If username/email is duplicated in DB (unique constraint)
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Username or email is already taken"
                });
            }

            // Other DB/server errors
            console.error("Error createNewUser:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // 4. After successful insert, get newly created user ID
        const userId = results.insertId;
        const plotData = { user_id: userId };
        
        // Initialize default garden plots for the new user
        // This is done async and does not block registration response
        gardenModel.initializePlotsForUser(plotData, (plotError) => {
            if (plotError) {
                // Log error but still allow registration to succeed
                console.error("Error initializing plots:", plotError);
                // Continue anyway - plots can be created later
            } else {
                console.log(`Garden plots initialized for user ${userId}`);
            }
        });

        // 5. Store values in res.locals for the NEXT middleware (usually JWT token creation)
        res.locals.user_id = userId;
        res.locals.message = "Registration successful";

        // Continue to next middleware
        next();
    };

    // Execute insert query
    userModel.insertSingle(data, callback);
};



// =========================
// Update user (currently commented out / unused)
// =========================
/* 
module.exports.updateUserById = (req, res, next) =>
{
    // Validate username exists
    if(req.body.username == undefined)
    {
        return res.status(400).json({
            message: "Username is missing"
        });
    }

    // Prepare updated user data
    const data = {
        user_id: req.params.id,
        username: req.body.username,
        points: req.body.points
    }

    const callback = (error, results, fields) => {
        if (error) {
            // Handle duplicate username error
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Username is already taken"
                });
            }
            console.error("Error updateUserById:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        } else {
            // If no row updated, user was not found
            if(results.affectedRows == 0) 
            {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            // Return updated user info
            else 
                return res.status(200).json({
                    user_id: data.user_id,
                    username: data.username,
                    points: data.points
                });
        }
    }

    // Run update query
    userModel.updateUserById(data, callback);
}
*/


// =========================
// Middleware: Validate user exists (used before protected routes)
// =========================
module.exports.validateUser = (req, res, next) =>
{
    // Read user id from res.locals (usually set by JWT middleware)
    const data = {
        user_id: res.locals.userId // NOTE: Make sure this matches your JWT middleware output (userId vs user_id)
    }

    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error readUserById:", error);

            // Return error response (currently returning raw error object)
            return res.status(500).json({ message: "Internal server error" });
        } else {
            // If user does not exist
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            else {
                // Store found user record into req.user for later handlers
                req.user = results[0];

                // Continue to next middleware/controller
                return next();
            }
        }
    }

    // Query DB to check if user exists
    userModel.selectById(data, callback);
}


// =========================
// Login middleware (find user + pass data to next middleware)
// =========================
module.exports.login = (req, res, next) => {
    try { 
        // Fields required for login
        const requiredFields = ['username', 'password'];

        // Validate body fields exist and are not empty
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === "") {
                res.status(400).json({ message: `${field} is undefined or empty` });
                return;
            }
        };

        // Prepare data for login model query
        // NOTE: res.locals.hash here is odd naming — depends on how your login flow is implemented
        const data = {
            username: req.body.username,
            password: res.locals.hash
        };

        // Callback after DB query
        const callback = (error, results) => {
            if(error){
                console.error("Error login callback: ", error);
                return res.status(500).json({
                    message: "Internal server error"
                });
            } else {
                // If user not found
                if(results.length == 0){
                    return res.status(404).json({message: "User not found"}); 
                } else {
                    // Store user_id for next middleware (JWT creation)
                    res.locals.user_id = results[0].user_id

                    // Store user's hashed password for next middleware (bcrypt compare)
                    res.locals.hash = results[0].password

                    return next();
                }
            }
        };

        // Query DB for user login
        userModel.login(data, callback);

    } catch (error) {
        // Catch unexpected errors
        console.error("Error login: ", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// =========================
// Retrieve top 10 users (leaderboard)
// =========================
module.exports.readTop10 = (req, res, next) =>
{
    // Callback after DB query
    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error readTop10User:", error);

            // Return error response (currently returning raw error object)
            return res.status(500).json({ message: "Internal server error" });
        } 
        // Return leaderboard list
        else return res.status(200).json(results);
    }

    // Query DB for top 10 users
    userModel.selectTop10(callback);
}
