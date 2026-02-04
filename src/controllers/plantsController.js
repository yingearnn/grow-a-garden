// Import plant-related database functions
const plantsModel = require("../models/plantsModel.js");

// =========================
// Retrieve all plants from database
// =========================
module.exports.readAllPlants = (req, res, next) =>
{
    // Callback runs after DB query completes
    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error readAllPlants:", error);

            // Return server error response
            return res.status(500).json({
                message: "Internal server error"
            });
        } 
        else
            // Return list of plants (results[1] likely from stored procedure)
            return res.status(200).json(results[1]);
    }

    // Query database for all plants
    plantsModel.selectAllPlants(callback);
}


// =========================
// Retrieve a single plant by ID
// (Middleware - attaches plant to req.plant)
// =========================
module.exports.readPlantById = (req, res, next) =>
{
    // Extract plant ID from route parameter
    const data = {
        id: req.params.id
    }

    // Callback after DB query
    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error readPlantById:", error);

            // Return server error response
            return res.status(500).json({
                message: "Internal server error"
            });
        } else {
            // If no plant found
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "Plant not found"
                });
            }
            else {
                // Store plant data for next middleware (buyPlants)
                req.plant = results[0];

                // Continue to next handler
                return next();
            }
        }
    }

    // Query DB for plant by ID
    plantsModel.selectPlantsById(data, callback);
}


// =========================
// Buy a plant
// =========================
module.exports.buyPlants = (req, res, next) =>
{
    // Check if plant still has stock remaining
    if(req.plant.stock <= 0) {
        return res.status(400).json({ message: "Plant out of stock" });
    }
    
    // Check if user has enough points to purchase plant
    if(req.plant.points > req.user.points) {
        return res.status(400).json({ message: "Insufficient points" });
    }

    // Prepare purchase transaction data
    const data = {
        user_id: req.user.user_id,        // User buying the plant
        plant_id: req.plant.plant_id,     // Plant being purchased
        points: req.plant.points          // Cost in points
    } 
   
    // Callback after DB purchase operation
    const callback = (error, results, fields) => {
        if (error) {
            // Log purchase error
            console.error("Error buyPlant:", error);

            // Return error response (raw error currently returned)
            return res.status(500).json({ message: "Internal server error" });
        } 
        else {
            // Successful purchase response
            return res.status(201).json({
                plant_id: req.plant.plant_id,
                user_id: req.user.user_id
            })
        }
    }

    // Execute DB logic to:
    // - Deduct user points
    // - Reduce plant stock
    // - Record plant ownership
    plantsModel.boughtPlant(data, callback);
}


// =========================
// Get all plants owned by a user
// =========================
module.exports.ownedPlantsById = (req, res, next) =>
{   
    // Get user ID from route parameter
    const data = {
        id: req.params.id
    }
  
    // Callback after DB query
    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error readOwnedId:", error);

            // Return server error response
            return res.status(500).json({
                message: "Internal server error"
            });
        
        } else {
            // If user owns no plants
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "User does not own any plants"
                });
            }
            else {
                // Return list of owned plants
                return res.status(200).json(results);
            }
        }
    }
  
    // Query DB for plants owned by user
    plantsModel.getOwned(data, callback);
}
