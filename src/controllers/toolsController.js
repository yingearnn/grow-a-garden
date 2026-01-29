// ADD TO EXISTING FILE: src/controllers/toolsController.js
// ADD THESE FUNCTIONS

const toolsModel = require("../models/toolsModel.js");

module.exports.getAllTools = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error getAllTools:", error);
            return res.status(500).json(error);
        }
        else {
            return res.status(200).json(results);
        }
    };

    toolsModel.selectAllTools(callback);
};

module.exports.selectToolsById = (req, res, next) => {
    const data = {
        id: req.params.id
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error selectToolsById:", error);
            return res.status(500).json(error);
        }
        else {
            if (results.length == 0) {
                return res.status(404).json({
                    message: "Tool not found"
                });
            }
            else {
                req.tool = results[0];
                return next();
            }
        }
    };

    toolsModel.selectToolsById(data, callback);
};

module.exports.buyTools = (req, res, next) => {
    // Check if user has enough points
    if (req.tool.cost > req.user.points) {
        return res.status(400).json({ message: "Insufficient points" });
    }

    // Check if tool is in stock
    if (req.tool.stock <= 0) {
        return res.status(400).json({ message: "Tool out of stock" });
    }

    const data = {
        user_id: req.body.user_id,
        item_id: req.tool.item_id,
        points: req.tool.cost
    };

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error buyTools:", error);
            return res.status(500).json(error);
        }
        else {
            return res.status(201).json({
                message: "Tool purchased and applied to all planted plants",
                item_id: req.tool.item_id,
                user_id: req.body.user_id,
                multiplier: req.tool.multiplier
            });
        }
    };

    toolsModel.boughtTool(data, callback);
};