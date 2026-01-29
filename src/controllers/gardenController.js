const gardenModel = require("../models/gardenModel.js"); 

module.exports.checkInventory = (req, res, next) => {
    const { user_id, plant_id } = req.body;

    const data = { user_id, plant_id };

    const callback = (error, results) => {
        if (error) return next(error);

        if (results.length === 0) {
            return res.status(400).json({
                message: "Plant not found in inventory"
            });
        }

        // pass forward
        req.plantData = {
            user_id,
            plant_id,
            plot_number: req.body.plot_number
        };

        next();
    };

    gardenModel.checkInventory(data, callback);
};

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

module.exports.removeFromInventory = (req, res, next) => {
    const data = req.plantData;

    const callback = (error, result) => {
        if (error) return next(error);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Failed to remove plant from inventory"
            });
        }

        next();
    };

    gardenModel.removeFromInventory(data, callback);
};

module.exports.plantIntoPlot = (req, res, next) => {
    const data = req.plantData;

    const callback = (error) => {
        if (error) return next(error);

        res.status(200).json({
            message: "Plant planted successfully 🌱",
            plot_number: data.plot_number
        });
    };

    gardenModel.plantInPlot(data, callback);
};

module.exports.readPlantedPlot = (req, res, next) =>
{
    const data = {
        user_id: req.body.user_id,
        plot_number: req.body.plot_number
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readPlantedPlot:", error);
            return res.status(500).json(error);
        }
        else {
            if (results.length === 0) {
                return res.status(404).json({
                    message: "No plant found in this plot"
                });
            }
            else {
                req.plant = results[0]; // attach plant info
                return next();
            }
        }
    };

    gardenModel.getPlantedPlot(data, callback);
};



module.exports.clearGardenPlot = (req, res, next) =>
{
    const data = {
        user_id: req.body.user_id,
        plot_number: req.body.plot_number
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error clearGardenPlot:", error);
            return res.status(500).json(error);
        }
        else {
            return next();
        }
    };

    gardenModel.clearPlot(data, callback);
};

module.exports.sellPlant = (req, res, next) =>
{
    const data = {
        user_id: req.body.user_id,
        value: req.plant.value
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error sellPlant:", error);
            return res.status(500).json(error);
        }
        else {
            return res.status(200).json({
                message: "Plant sold successfully",
                plant_id: req.plant.plant_id,
                plot_number: req.body.plot_number
            });
        }
    };

    gardenModel.addSellValue(data, callback);
};

module.exports.getGardenPlots = (req, res, next) => {
    const gardenModel = require("../models/gardenModel.js");
    const data = {
        user_id: req.params.userId
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error getGardenPlots:", error);
            return res.status(500).json(error);
        }
        else {
            return res.status(200).json(results);
        }
    };

    gardenModel.getAllPlots(data, callback);
};