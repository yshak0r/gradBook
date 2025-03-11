const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth_controller");

const verify = () => console.log("verifying id...");
const register = () => console.log("registering a user...");

router.route("/verify").post(verify);
router.route("/register").post(authController.registerUser);
router.route("/login").post(authController.loginUser);

module.exports = router;
