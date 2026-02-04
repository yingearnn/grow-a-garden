const pool = require('../services/db');


// Insert a new wellness challenge and deduct user points
module.exports.insertChallenge = (data, callback) =>
{
    const SQLSTATMENT = `
        INSERT INTO WellnessChallenge (creator_id, description, points)
        VALUES (?, ?, ?);

        UPDATE User
        SET points = points - 10
        WHERE user_id = ?;
    `;

    const VALUES = [data.user_id, data.description, data.points, data.user_id];

    pool.query(SQLSTATMENT, VALUES, callback);
}


// Get all wellness challenges
module.exports.selectAll = (callback) =>
{
    const SQLSTATMENT = `
        SELECT * FROM WellnessChallenge;
    `;

    pool.query(SQLSTATMENT, callback);
}


// Get user info and latest challenge created by user
module.exports.selectLatest = (data , callback) =>
{
    const SQLSTATMENT = `
        SELECT * 
        FROM User
        WHERE user_id = ?;

        SELECT * 
        FROM WellnessChallenge 
        WHERE creator_id = ? 
        ORDER BY created_on DESC 
        LIMIT 1;
    `;

    const VALUES = [data.user_id , data.user_id];

    pool.query(SQLSTATMENT, VALUES, callback);
}


// Delete a challenge and its completion records
module.exports.deleteChallengesById = (data, callback) =>
{
    const SQLSTATEMENT = `
        DELETE FROM UserCompletion
        WHERE challenge_id = ?;

        DELETE FROM WellnessChallenge 
        WHERE challenge_id = ?;
    `;

    const VALUES = [data.id, data.id];

    pool.query(SQLSTATEMENT, VALUES, callback);
}


// Update a challenge's description and points
module.exports.updateChallengesById = (data, callback) =>
{
    const SQLSTATEMENT = `
        UPDATE WellnessChallenge
        SET description = ?, points = ?
        WHERE challenge_id = ? AND creator_id = ?;
    `;

    const VALUES = [data.description, data.points, data.challenge_id, data.user_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
}


// Get a single challenge by ID
module.exports.getChallengeById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT * FROM WellnessChallenge
        WHERE challenge_id = ?;
    `;

    const VALUES = [data.challenge_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};
