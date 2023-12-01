const express = require('express')
const router = express.Router()
const { loginUser, signupUser } = require("../controllers/usersController");
// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

// router.route('/')
//     .get(usersController.getAllUsers)
//     .post(usersController.createNewUser)
//     .patch(usersController.updateUser)
//     .delete(usersController.deleteUser)

//login route
router.post("/login", loginUser);
//signup route
router.post("/signup", signupUser);

// module.exports = router
