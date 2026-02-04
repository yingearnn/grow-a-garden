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
  // Always trust authenticated user, not req.body.user_id
  const userId = req.user.user_id;

  // Stock check
  if (req.tool.stock <= 0) {
    return res.status(400).json({ message: "Tool out of stock" });
  }

  // Points check
  if (req.tool.cost > req.user.points) {
    return res.status(400).json({ message: "Insufficient points" });
  }

  const data = {
    user_id: userId,
    item_id: req.tool.item_id,
    cost: req.tool.cost,
    multiplier: req.tool.multiplier,
  };

  toolsModel.boughtTool(data, (error) => {
    if (error) {
      console.error("Error buyTools:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(201).json({
      item_id: req.tool.item_id,
      user_id: userId,
      multiplier: req.tool.multiplier,
    });
  });
};

