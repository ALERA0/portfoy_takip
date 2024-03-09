const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Portfolio = require("../models/Portfolio");
const { errorCodes } = require("../shared/handlers/error/errorCodes.js");
const { customError } = require("../shared/handlers/error/customError.js");
const {
  customSuccess,
} = require("../shared/handlers/success/customSuccess.js");
const { successCodes } = require("../shared/handlers/success/successCodes.js");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new customError(errorCodes.REQUIRED_FIELD);
  }

  const foundUser = await User.findOne({ email }).exec();

  const userId = foundUser._id.toHexString();

  const portfolios = await Portfolio.find({ createdBy: userId });

  const defaultPortfolioId = portfolios[0]._id.toHexString();

  if (!foundUser) {
    throw new customError(errorCodes.USER_NOT_FOUND);
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) throw new customError(errorCodes.USER_NOT_FOUND);

  const accessToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
        username: foundUser.username,
        _id: foundUser._id,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const successResponse = new customSuccess(successCodes.LOGIN_SUCCESS, {
    accessToken,
    defaultPortfolioId,
  });

  res.json(successResponse);
});

const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        email: decoded.email,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: foundUser.email,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    })
  );
};

const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

module.exports = {
  login,
  refresh,
  logout,
};
