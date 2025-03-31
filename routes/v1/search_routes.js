const express = require("express");
const router = express.Router();

const verify = () => console.log("verifying id...");
const register = () => console.log("registering a user...");

router.route("/verify").post(verify);
router.route("/register").post(register);

module.exports = router;
