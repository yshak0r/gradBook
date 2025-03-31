const User = require("../models/user_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          username: user.username,
          email: user.email,
          id: user._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
      );

      res.status(200).json({
        token,
        message: "User logged in successfully!",
      });
    } else {
      res.status(401).json({
        error: "invalid password!",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Server error",
    });
  }
};

const registerUser = async (req, res) => {
  const user = req.body;
  const email = user.email;
  if (await User.findOne({ email })) {
    res.status(404).json({
      message: "User already exist",
    });
  }
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const newUser = await User.create({
    username: user.username,
    email: user.email,
    password: hashedPassword,
  });

  const token = jwt.sign(
    {
      username: user.username,
      email: user.email,
      id: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );

  res.status(201).json({ message: "Registration successful", token });
};

module.exports = { loginUser, registerUser };
