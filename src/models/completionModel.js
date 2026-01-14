const pool = require('../services/db');
// Insert a new completion record
module.exports.insertCompletion = (data, callback) => //qn mark is equal to how many values. Here the qn mark is for the name level input.
{
    const SQLSTATEMENT = `
    INSERT INTO UserCompletion (challenge_id , user_id , details) 
    VALUES (?, ?,?)
    `;
const VALUES = [data.challenge_id ,data.user_id , data.details];

pool.query(SQLSTATEMENT, VALUES, callback);
}
// Get all completions for a specific challenge
module.exports.getUserCompleteById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT user_id ,details FROM UserCompletion
        WHERE challenge_id = ?;
    `;
    const VALUES = [data.id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

// Get points for a challenge
module.exports.getPoints = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT points 
        FROM WellnessChallenge
        WHERE challenge_id = ?;
    `;
    const VALUES = [data.id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};
// Update points for a user
module.exports.updatePoints = (data, callback) =>
{
    const SQLSTATEMENT = `
    UPDATE User
    SET points = points + ?
    WHERE user_id = ?
    `;
const VALUES = [data.points, data.user_id];

pool.query(SQLSTATEMENT, VALUES, callback);
}

