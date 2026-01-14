const pool = require('../services/db');
// Get all users
module.exports.selectAll = (callback) =>
{
    const SQLSTATEMENT = `
    SELECT * FROM User;
    `;

pool.query(SQLSTATEMENT, callback);
}
// Get a specific user by ID
module.exports.selectById = (data, callback) =>  
{
    const SQLSTATEMENT = `
    SELECT * FROM User
    WHERE user_id = ?;        
    `;
const VALUES = [data.user_id];

pool.query(SQLSTATEMENT, VALUES, callback);
}
// Insert a new user
module.exports.insertSingle = (data, callback) => 
{
    const SQLSTATEMENT = `
    INSERT INTO User (username)
    VALUES (?);
    `;
const VALUES = [data.username];

pool.query(SQLSTATEMENT, VALUES, callback);
}

// Update a user's information
module.exports.updateUserById = (data, callback) =>
{
    const SQLSTATEMENT = `
    UPDATE User
    SET username = ?
    WHERE user_id = ?
    `;
const VALUES = [data.username,data.user_id];

pool.query(SQLSTATEMENT, VALUES, callback);
}