// models/gardenModel.js
const pool = require("../services/db");

// Check if plant exists in user's inventory
module.exports.checkInventory = (data, callback) => {
    const SQL = `
        SELECT * FROM UserPlants
        WHERE user_plant_id = ?;
    `;
    pool.query(SQL, [data.user_plant_id], callback);
};

// Get a specific plot
module.exports.getPlot = (data, callback) => {
    const SQL = `
        SELECT * FROM GardenPlots
        WHERE user_id = ? AND plot_number = ?;
    `;
    pool.query(SQL, [data.user_id, data.plot_number], callback);
};

// Remove a plant from inventory
module.exports.markAsPlanted = (data, callback) => {
    const SQL = `
        UPDATE UserPlants
        SET is_planted = TRUE
        WHERE user_plant_id = ?;
    `;
    pool.query(SQL, [data.id], callback);
};

// Plant a plant into a plot
module.exports.plantInPlot = (data, callback) => {
    // Update the plot with user_plant_id and the correct value
    const SQL = `
        UPDATE GardenPlots
        SET plant_id = ?, value = (
            SELECT p.value
            FROM Plants p
            JOIN UserPlants up ON up.plant_id = p.plant_id
            WHERE up.user_plant_id = ?
        )
        WHERE user_id = ? AND plot_number = ?;
    `;
    // Pass user_plant_id, not plant_id
    pool.query(SQL, [data.user_plant_id, data.user_plant_id, data.user_id, data.plot_number], callback);
};

// Get a planted plot
module.exports.getPlantedPlot = (data, callback) => {
    const SQL = `
        SELECT gp.plant_id, gp.value , gp.planted_on
        FROM GardenPlots gp
        WHERE gp.user_id = ? AND gp.plot_number = ?;
    `;
    pool.query(SQL, [data.user_id, data.plot_number], callback);
};

// Clear a plot
module.exports.clearPlot = (data, callback) => {
    const SQL = `
        UPDATE GardenPlots
        SET plant_id = NULL, value = 0
        WHERE user_id = ? AND plot_number = ?;
    `;
    pool.query(SQL, [data.user_id, data.plot_number], callback);
};

// Add points/net worth after selling
module.exports.addSellValue = (data, callback) => {
    const SQL = `
        UPDATE User
        SET net_worth = net_worth + ?
        WHERE user_id = ?;
    `;
    pool.query(SQL, [data.value, data.user_id], callback);
};

// Get all plots for a user
module.exports.getAllPlots = (data, callback) => {
    const SQL = `
        SELECT 
            gp.plot_id,
            gp.plot_number,
            gp.plant_id,
            gp.planted_on,
            gp.value,
            p.name,
            p.rarity,
            p.plantImage
        FROM GardenPlots gp
        LEFT JOIN UserPlants up ON gp.plant_id = up.user_plant_id
        LEFT JOIN Plants p ON up.plant_id = p.plant_id
        WHERE gp.user_id = ?
        ORDER BY gp.plot_number ASC;
    `;
    pool.query(SQL, [data.user_id], callback);
};

// Initialize 20 empty plots for a new user
module.exports.initializePlotsForUser = (data, callback) => {
    const SQL = `
        INSERT INTO GardenPlots (user_id, plot_number, plant_id)
        VALUES 
        (?, 1, NULL), (?, 2, NULL), (?, 3, NULL), (?, 4, NULL), (?, 5, NULL),
        (?, 6, NULL), (?, 7, NULL), (?, 8, NULL), (?, 9, NULL), (?, 10, NULL),
        (?, 11, NULL), (?, 12, NULL), (?, 13, NULL), (?, 14, NULL), (?, 15, NULL),
        (?, 16, NULL), (?, 17, NULL), (?, 18, NULL), (?, 19, NULL), (?, 20, NULL);
    `;
    const userId = data.user_id;
    const VALUES = Array(20).fill(userId); // 20 times the same user_id
    pool.query(SQL, VALUES, callback);
};