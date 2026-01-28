const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const challengesRoutes = require('./challengesRoutes');
const plantsRoutes = require('./plantsRoutes');
const toolsRoutes = require('./toolsRoutes');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const bcryptMiddleware = require('../middlewares/bcryptMiddleware');
const userController = require('../controllers/userController');



//local host needs to have 3000(hte url)
router.use("/user" , userRoutes )
router.use("/challenges" , challengesRoutes )
router.use("/plants" , plantsRoutes )
router.use("/tools" , toolsRoutes )


router.post("/login", userController.login, bcryptMiddleware.comparePassword, jwtMiddleware.generateToken, jwtMiddleware.sendToken);
router.post(
  "/register",
  bcryptMiddleware.hashPassword,
  userController.createNewUser,
  jwtMiddleware.generateToken,
  jwtMiddleware.sendToken
);

module.exports = router;