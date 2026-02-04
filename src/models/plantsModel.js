const pool = require('../services/db');
//get all plants
module.exports.selectAllPlants = (callback) =>
{
    const SQLSTATEMENT = `
    UPDATE plants
   SET stock = FLOOR(1 + RAND() * max_stock);
    SELECT * FROM Plants;
    `;

    pool.query(SQLSTATEMENT, callback);
}
//get a specific plant
module.exports.selectPlantsById = (data, callback) =>  
{
    const SQLSTATEMENT = `
    SELECT * FROM Plants
    WHERE plant_id = ?;        
    `;
    const VALUES = [data.id];

    pool.query(SQLSTATEMENT, VALUES, callback);
}
//buy a specific plant
module.exports.boughtPlant = (data, callback) => 
{
    const SQLSTATEMENT = `
    INSERT INTO UserPlants (user_id, plant_id) 
    VALUES (?, ?);

    UPDATE User 
    SET points = points - ? 
    WHERE user_id = ?;

    UPDATE Plants
    SET stock = stock - 1
    WHERE plant_id = ?;
    `;

    const VALUES = [data.user_id, data.plant_id, data.points, data.user_id, data.plant_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
}
//get plants owned by user
module.exports.getOwned = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT 
            up.user_plant_id,
            up.plant_id,
            up.acquired_on,
            p.name,
            p.rarity,
            p.value
        FROM UserPlants up
        JOIN Plants p ON up.plant_id = p.plant_id
        WHERE up.user_id = ?
          AND up.is_planted = FALSE   -- <--- only show unplanted plants
        ORDER BY up.acquired_on DESC;
    `;
    const VALUES = [data.id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};