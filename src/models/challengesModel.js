const pool = require('../services/db');
// Insert a new challenge
module.exports.insertChallenge = (data, callback) => //qn mark is equal to how many values. Here the qn mark is for the name level input.
{
    const SQLSTATMENT = `
   
    INSERT INTO WellnessChallenge (creator_id, description,points)
    VALUES (?, ?, ?);

    UPDATE User
    SET points = points - 10
    WHERE user_id = ?;
    `;
const VALUES = [data.user_id,data.description,data.points,data.user_id];

pool.query(SQLSTATMENT, VALUES, callback);
}

// Get all challenges
module.exports.selectAll = (callback) =>
{
    const SQLSTATMENT = `
    SELECT * FROM WellnessChallenge ;
    `;
  
pool.query(SQLSTATMENT, callback);
}

module.exports.selectLatest = (data , callback) =>
{
    const SQLSTATMENT = `

    SELECT * 
       FROM USER
       WHERE user_id = ?;
    SELECT * 
        FROM WellnessChallenge 
        WHERE creator_id = ? 
        ORDER BY created_on DESC 
        LIMIT 1;
    `;
 const VALUES = [data.user_id , data.user_id]
pool.query(SQLSTATMENT,VALUES, callback);
}

// Delete challenge and associated completions

module.exports.deleteChallengesById = (data, callback) =>
{
    const SQLSTATEMENT = `
    DELETE FROM UserCompletion
    WHERE challenge_id = ?
    ;

    DELETE FROM WellnessChallenge 
    WHERE challenge_id = ?
    ;
    `;
const VALUES = [data.id,data.id];

pool.query(SQLSTATEMENT, VALUES, callback);
}
// Update a challenge
module.exports.updateChallengesById = (data, callback) =>
{
    const SQLSTATEMENT = `
    UPDATE  WellnessChallenge
    SET description = ? , points = ?
     WHERE challenge_id = ? AND creator_id = ?
    `;
const VALUES = [data.description,data.points,data.challenge_id,data.user_id];

pool.query(SQLSTATEMENT, VALUES, callback);
}
// Get a challenge by ID
module.exports.getChallengeById = (data, callback) =>
{
    const SQLSTATEMENT = `
        SELECT * FROM WellnessChallenge
        WHERE challenge_id = ?;
    `;
    const VALUES = [data.challenge_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

