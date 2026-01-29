const pool = require('../services/db');

module.exports.selectToolsById = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM Tools
    WHERE item_id = ?;        
    `;
    const VALUES = [data.id];
    pool.query(SQLSTATEMENT, VALUES, callback);
}

module.exports.boughtTool = (data, callback) => {
    const SQLSTATEMENT = `
    -- Record the tool purchase
    INSERT INTO UserTools (user_id, item_id)
    VALUES (?, ?);

    -- Deduct points from the user
    UPDATE User
    SET points = points - ?
    WHERE user_id = ?;

    -- Apply multiplier to all planted plants immediately
    UPDATE GardenPlots gp
    JOIN UserPlants up ON gp.plant_id = up.user_plant_id
    SET gp.value = gp.value * ?
    WHERE gp.user_id = ? AND gp.plant_id IS NOT NULL;

    -- Decrease tool stock
    UPDATE Tools
    SET stock = stock - 1
    WHERE item_id = ?;
    `;

    // CRITICAL FIX: Pass the actual multiplier value, not item_id!
    const VALUES = [
        data.user_id,      // INSERT UserTools - user_id
        data.item_id,      // INSERT UserTools - item_id
        data.cost,         // UPDATE User - points to deduct
        data.user_id,      // UPDATE User - which user
        data.multiplier,   // UPDATE GardenPlots - ACTUAL multiplier value (FIXED!)
        data.user_id,      // UPDATE GardenPlots - which user's plants
        data.item_id       // UPDATE Tools - which tool's stock to decrease
    ];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

module.exports.selectAllTools = (callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM Tools
    ORDER BY cost ASC;
    `;
    pool.query(SQLSTATEMENT, callback);
};