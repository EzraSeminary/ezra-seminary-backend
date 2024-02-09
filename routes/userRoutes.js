const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  updateUserProfile,
} = require("../controllers/usersController");
// const verifyJWT = require("../middleware/requireAuth");
const requireAuth = require("../middleware/requireAuth");
S;

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
router.route("/profile").post(requireAuth, updateUserProfile);

module.exports = router;
