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
module.exports.insertSingle = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO User (username, email, password)
        VALUES (?, ?, ?);
    `;

    const VALUES = [
        data.username,
        data.email,
        data.password
    ];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

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

//Get user's info for login
module.exports.login = (data, callback) => {

    const SQLSTATEMENT = `
        SELECT *
        FROM User
        WHERE username = ?;
    `;

    VALUES = [data.username];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//get users with the highest net_worth
module.exports.selectTop10 = (callback) => {
    const SQLSTATEMENT = `
        SELECT username , points , net_worth
        FROM User
        ORDER BY net_worth DESC
        LIMIT 10;
    `;

    pool.query(SQLSTATEMENT, callback);
};

