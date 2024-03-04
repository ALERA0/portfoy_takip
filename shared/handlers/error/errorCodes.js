const { StatusCodes } = require("http-status-codes");

const errorCodes ={
  REQUIRED_FIELD: {
    code: StatusCodes.BAD_REQUEST,
    message: "REQUIRED_FIELD"
  },
  USER_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "USER_NOT_FOUND"
  },
  USER_ALREADY_EXISTS:{
    code: StatusCodes.BAD_REQUEST,
    message: "USER_ALREADY_EXISTS"
  },
  INVALID_USER_INFO:{
    code: StatusCodes.BAD_REQUEST,
    message: "INVALID_USER_INFO"
  },
  STOCK_NOT_FOUND:{
    code: StatusCodes.NOT_FOUND,
    message: "STOCK_NOT_FOUND"
  }
}


module.exports = { errorCodes };