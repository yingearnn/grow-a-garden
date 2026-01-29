const pool = require('../services/db');

module.exports.selectAllPlants = (callback) =>
{
    const SQLSTATEMENT = `
    SELECT * FROM Plants ;
    `;

pool.query(SQLSTATEMENT, callback);
}

module.exports.selectPlantsById = (data, callback) =>  
{
    const SQLSTATEMENT = `
    SELECT * FROM Plants
    WHERE plant_id = ?;        
    `;
const VALUES = [data.id];

pool.query(SQLSTATEMENT, VALUES, callback);
}

module.exports.boughtPlant = (data, callback) => 
{
    const SQLSTATEMENT = `
    INSERT INTO UserPlants (user_id , plant_id) 
    VALUES (?,?);

    UPDATE User 
    SET points = points - ? 
    WHERE user_id = ? ;
    `
    
    
    ;
const VALUES = [data.user_id , data.plant_id, data.points , data.user_id];

pool.query(SQLSTATEMENT, VALUES, callback);
}

module.exports.getOwned = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT User.user_id, User.username, Plants.name , Plants.plant_id FROM UserPlants 
        INNER JOIN Plants ON UserPlants.plant_id = Plants.plant_id 
        INNER JOIN User ON UserPlants.user_id = User.user_id 
        WHERE User.user_id = ?
        

    `;
    const VALUES = [data.id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};