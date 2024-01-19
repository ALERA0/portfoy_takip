const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const Portfolio = require("../models/Portfolio");



// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // Get all users from MongoDB
  const users = await User.find().select("-password").lean();

  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles,email } = req.body;

  // Confirm data
  if (!username || !password || !email) {
    return res.status(400).json({ message: "Bütün alanlar doldurulmalıdır." });
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ email }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Aynı maille bir kayıt zaten var" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const userObject = { username, password: hashedPwd, roles,email };

  // Calculate the registration date
  const registrationDate = new Date();
  const accessExpiration = new Date(
    registrationDate.getTime() + 180 * 24 * 60 * 60 * 1000
  ); // 6 ay eklenir (180 gün)

  userObject.accessExpiration = accessExpiration;

  // Create and store new user
  const user = await User.create(userObject);

  

  if (user) {
    const defaultPortfolio = {
      name: "Portföy_1",
      createdBy:user._id,
      portfolioDetails: [], // Boş bir portföy
    };

    await Portfolio.create(defaultPortfolio);

    res.status(201).json({
      status: "success",
      message: `New user ${username} created with a default portfolio`,
    });
  } else {
    res
      .status(400)
      .json({ status: "error", message: "Invalid user data received" });
  }
});

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password, email} = req.body;

  // Confirm data
  if (
    !id ||
    !email ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ email }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Bu maille kayıt zaten var" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;
  user.email = email;

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user still have assigned notes?

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};