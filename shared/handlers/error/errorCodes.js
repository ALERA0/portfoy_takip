const { StatusCodes } = require("http-status-codes");

const errorCodes = {
  REQUIRED_FIELD: {
    code: StatusCodes.BAD_REQUEST,
    message: "REQUIRED_FIELD",
  },
  USER_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "USER_NOT_FOUND",
  },
  USER_ALREADY_EXISTS: {
    code: StatusCodes.BAD_REQUEST,
    message: "USER_ALREADY_EXISTS",
  },
  INVALID_USER_INFO: {
    code: StatusCodes.BAD_REQUEST,
    message: "INVALID_USER_INFO",
  },
  STOCK_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "STOCK_NOT_FOUND",
  },
  CURRENCY_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "CURRENCY_NOT_FOUND",
  },
  GOLD_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "GOLD_NOT_FOUND",
  },
  FUND_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "FUND_NOT_FOUND",
  },
  PORTFOLIO_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "PORTFOLIO_NOT_FOUND",
  },
  NAME_CAN_NOT_BE_EMPTY: {
    code: StatusCodes.BAD_REQUEST,
    message: "NAME_CAN_NOT_BE_EMPTY",
  },
  PORTFOLIO_NAME_TOO_SHORT: {
    code: StatusCodes.BAD_REQUEST,
    message: "PORTFOLIO_NAME_TOO_SHORT",
  },
  PORTFOLIO_ALREADY_EXISTS: {
    code: StatusCodes.BAD_REQUEST,
    message: "PORTFOLIO_ALREADY_EXISTS",
  },
  MISSING_FIELD: {
    code: StatusCodes.BAD_REQUEST,
    message: "MISSING_FIELD",
  },
  INVALID_ASSET_TYPE: {
    code: StatusCodes.BAD_REQUEST,
    message: "INVALID_ASSET_TYPE",
  },
  ASSET_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "ASSET_NOT_FOUND",
  },
  BUDGET_INSUFFICIENT: {
    code: StatusCodes.BAD_REQUEST,
    message: "BUDGET_INSUFFICIENT",
  },
  BUDGET_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "BUDGET_NOT_FOUND",
  },
  INVALID_BUDGET_VALUE: {
    code: StatusCodes.BAD_REQUEST,
    message: "INVALID_BUDGET_VALUE",
  },
  CRYPTO_NOT_FOUND: {
    code: StatusCodes.NOT_FOUND,
    message: "CRYPTO_NOT_FOUND",
  },
  INSUFFICIENT_ASSET_QUANTITY: {
    code: StatusCodes.BAD_REQUEST,
    message: "INSUFFICIENT_ASSET_QUANTITY",
  },
};

module.exports = { errorCodes };
