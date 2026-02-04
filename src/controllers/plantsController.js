const plantsModel = require("../models/plantsModel.js");

// Retrieves all plants from database
module.exports.readAllPlants = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllPlants:", error);
           return res.status(500).json({
            message: "Internal server error"
        });
        } 
        else
            return res.status(200).json(results[1]);
    }

    plantsModel.selectAllPlants(callback);
}

// Retrieve a single plant by its ID
module.exports.readPlantById = (req, res, next) =>
{
    const data = {
        id: req.params.id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readPlantById:", error);
            return res.status(500).json({
            message: "Internal server error"
        });
        } else {
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "Plant not found"
                });
            }
            else {
                req.plant = results[0];
                return next();
            }
        }
    }

    plantsModel.selectPlantsById(data, callback);
}

// Buy a plant for user
module.exports.buyPlants = (req, res, next) =>
{
    // Check if plant is in stock
    if(req.plant.stock <= 0) {
        return res.status(400).json({ message: "Plant out of stock" });
    }
    
    // Check if user has enough points
    if(req.plant.points > req.user.points) {
        return res.status(400).json({ message: "Insufficient points" });
    }

    const data = {
        user_id: req.body.user_id,
        plant_id: req.plant.plant_id,
        points: req.plant.points
    } 
   
    // Insert plant bought into database
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error buyPlant:", error);
            return res.status(500).json(error);
        } 
        else {
            return res.status(201).json({
                message: "Plant acquired",
                plant_id: req.plant.plant_id,
                user_id: req.body.user_id
            })
        }
    }

    // Call model function to insert purchase record
    plantsModel.boughtPlant(data, callback);
}

// Get all plants owned by a user
module.exports.ownedPlantsById = (req, res, next) =>
{   
    const data = {
        id: req.params.id
    }
  
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readOwnedId:", error);
            return res.status(500).json({
            message: "Internal server error"
        });
        
        } else {
            if(results.length == 0) 
            {
                return res.status(404).json({
                    message: "User does not own any plants"
                });
            }
            else {
                return res.status(200).json(results);
            }
        }
    }
  
    plantsModel.getOwned(data, callback);
}