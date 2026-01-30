// controllers/gardenController.js

const gardenModel = require("../models/gardenModel.js");

// Check that the plant exists in user's inventory
module.exports.checkInventory = (req, res, next) => {
    const { user_plant_id, plot_number } = req.body;

    if (!user_plant_id) {
        return res.status(400).json({ message: "user_plant_id is required" });
    }

    const data = { user_plant_id };

    const callback = (error, results) => {
        if (error) return next(error);

        if (results.length === 0) {
            return res.status(400).json({ message: "Plant not found in inventory" });
        }

        // Pass forward the plant data
        req.plantData = {
            user_id: results[0].user_id,
            plant_id: results[0].plant_id,       // type of plant
            user_plant_id: results[0].user_plant_id,
            plot_number
        };

        next();
    };

    gardenModel.checkInventory(data, callback);
};

// Check that the plot is valid and empty
module.exports.checkPlot = (req, res, next) => {
    const { user_id, plot_number } = req.plantData;

    if (plot_number < 1 || plot_number > 20) {
        return res.status(400).json({ message: "Invalid plot number" });
    }

    const data = { user_id, plot_number };

    const callback = (error, results) => {
        if (error) return next(error);

        if (results.length === 0) {
            return res.status(404).json({ message: "Plot not found" });
        }

        if (results[0].plant_id !== null) {
            return res.status(400).json({ message: "Plot already occupied" });
        }

        next();
    };

    gardenModel.getPlot(data, callback);
};

// Remove plant from inventory
module.exports.markAsPlanted = (req, res, next) => {
    const data = { id: req.plantedPlant };

    gardenModel.markAsPlanted(data, (error, result) => {
        if (error) return next(error);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Failed to mark plant as planted" });
        }

        // Final response after planting & marking done
        return res.status(200).json({
            message: "Plant planted successfully 🌱",
            plot_number: req.plotNumber
        });
    });
};

// Plant the plant into the plot
module.exports.plantIntoPlot = (req, res, next) => {
    const data = req.plantData;

    gardenModel.plantInPlot(data, (error) => {
        if (error) return next(error);

        // Pass data to next middleware to mark as planted
        req.plantedPlant = data.user_plant_id;
        req.plotNumber = data.plot_number;

        next(); // chain to markAsPlanted
    });
};

// Read a specific planted plot
module.exports.readPlantedPlot = (req, res, next) => {
    const data = {
        user_id: req.body.user_id,
        plot_number: req.body.plot_number
    };

    const callback = (error, results) => {
        if (error) {
            console.error("Error readPlantedPlot:", error);
            return res.status(500).json(error);
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "No plant found in this plot" });
        }

        req.plant = results[0]; // attach plant info
        next();
    };

    gardenModel.getPlantedPlot(data, callback);
};

// Clear a garden plot
module.exports.clearGardenPlot = (req, res, next) => {
    const data = {
        user_id: req.body.user_id,
        plot_number: req.body.plot_number
    };

    const callback = (error) => {
        if (error) {
            console.error("Error clearGardenPlot:", error);
            return res.status(500).json(error);
        }

        next();
    };

    gardenModel.clearPlot(data, callback);
};

// Sell a plant
module.exports.sellPlant = (req, res, next) => {
    const data = {
        user_id: req.body.user_id,
        value: req.plant.value
    };

    const callback = (error) => {
        if (error) {
            console.error("Error sellPlant:", error);
            return res.status(500).json(error);
        }

        return res.status(200).json({
            message: "Plant sold successfully",
            plant_id: req.plant.plant_id,
            plot_number: req.body.plot_number
        });
    };

    gardenModel.addSellValue(data, callback);
};

// Get all garden plots for a user
module.exports.getGardenPlots = (req, res, next) => {
    const data = { user_id: req.params.userId };

    const callback = (error, results) => {
        if (error) {
            console.error("Error getGardenPlots:", error);
            return res.status(500).json(error);
        }
          console.log("Garden plots for user", data.user_id, ":", results);
        return res.status(200).json(results);
    };

    gardenModel.getAllPlots(data, callback);
};
