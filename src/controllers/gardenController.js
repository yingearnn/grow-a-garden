// controllers/gardenController.js
const gardenModel = require("../models/gardenModel.js");

// =========================
// Check that the plant exists in user's inventory (and belongs to logged-in user)
// =========================
module.exports.checkInventory = (req, res, next) => {
  const { user_plant_id, plot_number } = req.body;
  const loggedInUserId = res.locals.userId;

  if (!user_plant_id) {
    return res.status(400).json({ message: "user_plant_id is required" });
  }

  const data = { user_plant_id };

  gardenModel.checkInventory(data, (error, results) => {
    if (error) {
      console.error("Error checkInventory:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Plant not found in inventory" });
    }

    // IMPORTANT: make sure this inventory plant belongs to the logged-in user
    if (parseInt(results[0].user_id) !== parseInt(loggedInUserId)) {
      return res.status(403).json({ message: "This plant does not belong to you" });
    }

    req.plantData = {
      user_id: results[0].user_id,
      plant_id: results[0].plant_id,
      user_plant_id: results[0].user_plant_id,
      plot_number
    };

    next();
  });
};

// =========================
// Check that the plot is valid and empty (for logged in user)
// =========================
module.exports.checkPlot = (req, res, next) => {
  const { user_id, plot_number } = req.plantData;

  if (plot_number < 1 || plot_number > 20) {
    return res.status(400).json({ message: "Invalid plot number" });
  }

  const data = { user_id, plot_number };

  gardenModel.getPlot(data, (error, results) => {
    if (error) {
      console.error("Error getPlot:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Plot not found" });
    }

    if (results[0].plant_id !== null) {
      return res.status(400).json({ message: "Plot already occupied" });
    }

    next();
  });
};

// =========================
// Plant the plant into the selected plot
// =========================
module.exports.plantIntoPlot = (req, res, next) => {
  const data = req.plantData;

  gardenModel.plantInPlot(data, (error) => {
    if (error) {
      console.error("Error plantInPlot:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    req.plantedPlant = data.user_plant_id;
    req.plotNumber = data.plot_number;
    next();
  });
};

// =========================
// Remove plant from inventory (mark as planted)
// =========================
module.exports.markAsPlanted = (req, res) => {
  const data = { id: req.plantedPlant };

  gardenModel.markAsPlanted(data, (error, result) => {
    if (error) {
      console.error("Error markAsPlanted:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Failed to mark plant as planted" });
    }

    return res.status(200).json({
      message: "Plant planted successfully 🌱",
      plot_number: req.plotNumber
    });
  });
};

// =========================
// Read a specific planted plot (SELL flow) - use logged-in userId
// =========================
module.exports.readPlantedPlot = (req, res, next) => {
  const loggedInUserId = res.locals.userId;
  const plot_number = req.body.plot_number;

  if (plot_number === undefined) {
    return res.status(400).json({ message: "plot_number is required" });
  }

  const data = {
    user_id: loggedInUserId,
    plot_number
  };

  gardenModel.getPlantedPlot(data, (error, results) => {
    if (error) {
      console.error("Error readPlantedPlot:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No plant found in this plot" });
    }

    req.plant = results[0];
    req.plotNumber = plot_number;
    next();
  });
};

// =========================
// Clear a garden plot (with cooldown check)
// =========================
module.exports.clearGardenPlot = (req, res, next) => {
  const loggedInUserId = res.locals.userId;
  const plot_number = req.plotNumber;

  const lastTime = new Date(req.plant.planted_on);
  const now = new Date();

  if (now - lastTime < 30 * 60 * 1000) {
    return res.status(400).json({ message: "Plants can only be sold after 30 minutes" });
  }

  const data = {
    user_id: loggedInUserId,
    plot_number
  };

  gardenModel.clearPlot(data, (error) => {
    if (error) {
      console.error("Error clearGardenPlot:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    next();
  });
};

// =========================
// Sell a plant (add points to user)
// =========================
module.exports.sellPlant = (req, res) => {
  const loggedInUserId = res.locals.userId;

  const data = {
    user_id: loggedInUserId,
    value: req.plant.value
  };

  gardenModel.addSellValue(data, (error) => {
    if (error) {
      console.error("Error sellPlant:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(200).json({
      message: "Plant sold successfully",
      plant_id: req.plant.plant_id,
      plot_number: req.plotNumber
    });
  });
};

// =========================
// Get all garden plots for a user (recommend: ignore param and use logged-in userId)
// =========================
module.exports.getGardenPlots = (req, res) => {
  // safer: always use logged in user id
  const loggedInUserId = res.locals.userId;

  const data = { user_id: loggedInUserId };

  gardenModel.getAllPlots(data, (error, results) => {
    if (error) {
      console.error("Error getGardenPlots:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(results);
  });
};
