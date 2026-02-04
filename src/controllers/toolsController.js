// Import tool-related database functions
const toolsModel = require("../models/toolsModel.js");

// =========================
// Get all tools
// =========================
module.exports.getAllTools = (req, res, next) => {

    // Callback runs after database query completes
    const callback = (error, results, fields) => {
        if (error) {
            // Log error for debugging
            console.error("Error getAllTools:", error);

            // Send server error response
            return res.status(500).json({
                message: "Internal server error"
            });
        }
        else {
            // Return tool list (results[1] likely comes from a stored procedure)
            return res.status(200).json(results[1]);
        }
    };

    // Call model function to retrieve all tools
    toolsModel.selectAllTools(callback);
};


// =========================
// Get a single tool by ID
// (Middleware style - attaches tool to req.tool)
// =========================
module.exports.selectToolsById = (req, res, next) => {

    // Get tool ID from route parameter
    const data = {
        id: req.params.id
    };

    // Callback after DB query
    const callback = (error, results, fields) => {
        if (error) {
            // Log DB error
            console.error("Error selectToolsById:", error);

            // Return server error response
            return res.status(500).json({
                message: "Internal server error"
            });
        }
        else {
            // If no tool found
            if (results.length == 0) {
                return res.status(404).json({
                    message: "Tool not found"
                });
            }
            else {
                // Store tool info in request object for next middleware
                req.tool = results[0];

                // Continue to next handler (usually buyTools)
                return next();
            }
        }
    };

    // Query DB for tool by ID
    toolsModel.selectToolsById(data, callback);
};


// =========================
// Buy a tool
// =========================
module.exports.buyTools = (req, res, next) => {

    // Check if user has enough points to buy tool
    if (req.tool.cost > req.user.points) {
        return res.status(400).json({ message: "Insufficient points" });
    }

    // Check if tool still has stock remaining
    if (req.tool.stock <= 0) {
        return res.status(400).json({ message: "Tool out of stock" });
    }

    // Prepare data for purchase transaction
    const data = {
        user_id: req.body.user_id,      // User making the purchase
        item_id: req.tool.item_id,      // Tool being bought
        cost: req.tool.cost,            // Cost in points
        multiplier: req.tool.multiplier // Effect applied to plants
    };

    // Callback after DB purchase logic completes
    const callback = (error, results, fields) => {
        if (error) {
            // Log purchase error
            console.error("Error buyTools:", error);

            // Return server error response
            return res.status(500).json({
                message: "Internal server error"
            });
        }
        else {
            // Successful purchase response
            return res.status(201).json({
                message: "Tool purchased and applied to all planted plants",
                item_id: req.tool.item_id,
                user_id: req.body.user_id,
                multiplier: req.tool.multiplier
            });
        }
    };

    // Execute DB logic to:
    // - Deduct user points
    // - Reduce tool stock
    // - Apply multiplier effect
    toolsModel.boughtTool(data, callback);
};
