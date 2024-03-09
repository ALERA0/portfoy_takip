const { StatusCodes } = require("http-status-codes");

const successCodes = {
  LOGIN_SUCCESS: {
    code: StatusCodes.OK,
    message: "LOGIN_SUCCESS",
  },
};

module.exports = { successCodes };
