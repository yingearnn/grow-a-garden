// controllers/gardenController.js

// Import garden-related database functions
const gardenModel = require("../models/gardenModel.js");

// =========================
// Check that the plant exists in user's inventory
// =========================
module.exports.checkInventory = (req, res, next) => {

    // Extract values from request body
    const { user_plant_id, plot_number } = req.body;

    // Ensure plant ID is provided
    if (!user_plant_id) {
        return res.status(400).json({ message: "user_plant_id is required" });
    }

    // Prepare query data
    const data = { user_plant_id };

    // Callback after DB inventory check
    const callback = (error, results) => {
        if (error) return next(error);

        // If plant does not exist in inventory
        if (results.length === 0) {
            return res.status(400).json({ message: "Plant not found in inventory" });
        }

        // Attach plant information for next middleware
        req.plantData = {
            user_id: results[0].user_id,           // Owner of plant
            plant_id: results[0].plant_id,         // Type of plant
            user_plant_id: results[0].user_plant_id, // Inventory record ID
            plot_number                           // Plot where plant will be placed
        };

        // Continue to next check
        next();
    };

    // Query DB to verify plant exists in inventory
    gardenModel.checkInventory(data, callback);
};


// =========================
// Check that the plot is valid and empty
// =========================
module.exports.checkPlot = (req, res, next) => {

    // Get data prepared in previous middleware
    const { user_id, plot_number } = req.plantData;

    // Validate plot number range (1 to 20)
    if (plot_number < 1 || plot_number > 20) {
        return res.status(400).json({ message: "Invalid plot number" });
    }

    // Prepare DB query data
    const data = { user_id, plot_number };

    // Callback after DB plot check
    const callback = (error, results) => {
        if (error) return next(error);

        // If plot does not exist
        if (results.length === 0) {
            return res.status(404).json({ message: "Plot not found" });
        }

        // If plot already has a plant
        if (results[0].plant_id !== null) {
            return res.status(400).json({ message: "Plot already occupied" });
        }

        // Plot is valid and empty → continue
        next();
    };

    // Query DB for plot status
    gardenModel.getPlot(data, callback);
};


// =========================
// Remove plant from inventory (mark as planted)
// =========================
module.exports.markAsPlanted = (req, res, next) => {

    // Get planted inventory record ID
    const data = { id: req.plantedPlant };

    // Update inventory record in DB
    gardenModel.markAsPlanted(data, (error, result) => {
        if (error) return next(error);

        // If no rows updated, planting failed
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Failed to mark plant as planted" });
        }

        // Final response after successful planting
        return res.status(200).json({
            message: "Plant planted successfully 🌱",
            plot_number: req.plotNumber
        });
    });
};


// =========================
// Plant the plant into the selected plot
// =========================
module.exports.plantIntoPlot = (req, res, next) => {

    // Get prepared planting data
    const data = req.plantData;

    // Insert plant into garden plot in DB
    gardenModel.plantInPlot(data, (error) => {
        if (error) return next(error);

        // Pass information to next middleware
        req.plantedPlant = data.user_plant_id;
        req.plotNumber = data.plot_number;

        // Continue to markAsPlanted
        next();
    });
};


// =========================
// Read a specific planted plot
// =========================
module.exports.readPlantedPlot = (req, res, next) => {

    // Prepare query data
    const data = {
        user_id: req.body.user_id,
        plot_number: req.body.plot_number
    };

    // Callback after DB query
    const callback = (error, results) => {
        if (error) {
            console.error("Error readPlantedPlot:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // If no plant exists in plot
        if (results.length === 0) {
            return res.status(404).json({ message: "No plant found in this plot" });
        }

        // Attach plant info for next middleware (selling)
        req.plant = results[0];
        next();
    };

    // Query DB for planted plot details
    gardenModel.getPlantedPlot(data, callback);
};


// =========================
// Clear a garden plot (with cooldown check)
// =========================
module.exports.clearGardenPlot = (req, res, next) => {

    // Prepare clear plot data
    const data = {
        user_id: req.body.user_id,
        plot_number: req.body.plot_number,
        time: req.plant.planted_on   // Time when plant was planted
    };

    // Convert stored planted time to Date object
    const lastTime = new Date(data.time);
    const now = new Date();

    // Enforce 30-minute cooldown before selling
    if (now - lastTime < 30 * 60 * 1000) {
        return res.status(400).json({ message: "Plants can only be sold after 30 minutes" });
    }

    // Callback after clearing plot
    const callback = (error) => {
        if (error) {
            console.error("Error clearGardenPlot:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // Continue to sellPlant middleware
        next();
    };

    // Remove plant from plot in DB
    gardenModel.clearPlot(data, callback);
};


// =========================
// Sell a plant (add points to user)
// =========================
module.exports.sellPlant = (req, res, next) => {

    // Prepare data to add sell value to user points
    const data = {
        user_id: req.body.user_id,
        value: req.plant.value
    };

    // Callback after updating user points
    const callback = (error) => {
        if (error) {
            console.error("Error sellPlant:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // Successful sale response
        return res.status(200).json({
            message: "Plant sold successfully",
            plant_id: req.plant.plant_id,
            plot_number: req.body.plot_number
        });
    };

    // Update user points in DB
    gardenModel.addSellValue(data, callback);
};


// =========================
// Get all garden plots for a user
// =========================
module.exports.getGardenPlots = (req, res, next) => {

    // Extract user ID from route parameter
    const data = { user_id: req.params.userId };

    // Callback after DB query
    const callback = (error, results) => {
        if (error) {
            console.error("Error getGardenPlots:", error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
         
        // Return all plot information
        return res.status(200).json(results);
    };

    // Query DB for all plots belonging to user
    gardenModel.getAllPlots(data, callback);
};
