const pool = require("../services/db");


 
module.exports.checkInventory = (data, callback) => {
    const SQL = `
        SELECT * FROM UserPlants
        WHERE user_id = ? AND plant_id = ?
        LIMIT 1;
    `;
    pool.query(SQL, [data.user_id, data.plant_id], callback);
};

module.exports.getPlot = (data, callback) => {
    const SQL = `
        SELECT * FROM GardenPlots
        WHERE user_id = ? AND plot_number = ?;
    `;
    pool.query(SQL, [data.user_id, data.plot_number], callback);
};

module.exports.removeFromInventory = (data, callback) => {
    const SQL = `
        DELETE FROM UserPlants
        WHERE user_id = ? AND plant_id = ?
        LIMIT 1;
    `;
    pool.query(SQL, [data.user_id, data.plant_id], callback);
};

module.exports.plantInPlot = (data, callback) => {
    const SQL = `
        UPDATE GardenPlots
        SET plant_id = ?
        WHERE user_id = ? AND plot_number = ?;
    `;
    pool.query(SQL, [data.plant_id, data.user_id, data.plot_number], callback);
};

module.exports.getPlantedPlot = (data, callback) =>
{
    const SQL = `
        SELECT gp.plant_id, p.value
        FROM GardenPlots gp
        JOIN Plants p ON gp.plant_id = p.plant_id
        WHERE gp.user_id = ? AND gp.plot_number = ?;
    `;
    pool.query(SQL, [data.user_id, data.plot_number], callback);
};

// Clear plot
module.exports.clearPlot = (data, callback) =>
{
    const SQL = `
        UPDATE GardenPlots
        SET plant_id = NULL
        WHERE user_id = ? AND plot_number = ?;
    `;
    pool.query(SQL, [data.user_id, data.plot_number], callback);
};

// Add sell value
module.exports.addSellValue = (data, callback) =>
{
    const SQL = `
        UPDATE User
        SET points = points + ?, net_worth = net_worth + ?
        WHERE user_id = ?;
    `;
    pool.query(SQL, [data.value, data.value, data.user_id], callback);
};