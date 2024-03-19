const { StatusCodes } = require("http-status-codes");

const successCodes = {
  LOGIN_SUCCESS: {
    code: StatusCodes.OK,
    message: "LOGIN_SUCCESS",
  },
  STOCKS_SUCCESS: {
    code: StatusCodes.OK,
    message: "STOCKS_SUCCESS",
  },
  CRYPTO_DETAIL_SUCCESS:{
    code: StatusCodes.OK,
    message: "CRYPTO_DETAIL_SUCCESS",
  },
  CRYPTO_SEARCH_SUCCESS:{
    code: StatusCodes.OK,
    message: "CRYPTO_SEARCH_SUCCESS",
  },
  CURRENCY_DETAIL_SUCCESS:{
    code: StatusCodes.OK,
    message: "CURRENCY_DETAIL_SUCCESS",
  },
  CURRENCY_SEARCH_SUCCESS:{
    code: StatusCodes.OK,
    message: "CURRENCY_SEARCH_SUCCESS",
  },
  FUND_DETAIL_SUCCESS:{
    code: StatusCodes.OK,
    message: "FUND_DETAIL_SUCCESS",
  },
  FUND_SEARCH_SUCCESS:{
    code: StatusCodes.OK,
    message: "FUND_SEARCH_SUCCESS",
  },
  GOLD_DETAIL_SUCCESS:{
    code: StatusCodes.OK,
    message: "GOLD_DETAIL_SUCCESS",
  },
  GOLD_SEARCH_SUCCESS:{
    code: StatusCodes.OK,
    message: "GOLD_SEARCH_SUCCESS",
  }
};

module.exports = { successCodes };
