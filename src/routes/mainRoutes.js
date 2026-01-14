const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const challengesRoutes = require('./challengesRoutes');
const plantsRoutes = require('./plantsRoutes');




//local host needs to have 3000(hte url)
router.use("/user" , userRoutes )
router.use("/challenges" , challengesRoutes )
router.use("/plants" , plantsRoutes )

module.exports = router;