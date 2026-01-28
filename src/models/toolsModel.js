const pool = require('../services/db');

module.exports.selectToolsById = (data, callback) =>  
{
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

       UPDATE Tools
        SET stock = stock - 1
        WHERE item_id = ?;
    `;

    const VALUES = [
        data.user_id,  // for UserTools insert
        data.item_id,  // for UserTools insert
        data.points,   // points to deduct
        data.user_id,  // which user to deduct points
        data.item_id,  // multiplier to apply from Tools
        data.user_id,  // which user's planted plants to update
         data.item_id
    ];

    pool.query(SQLSTATEMENT, VALUES, callback);
};