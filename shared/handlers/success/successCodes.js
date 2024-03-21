const { StatusCodes } = require("http-status-codes");

const successCodes = {
  LOGIN_SUCCESS: {
    code: StatusCodes.OK,
    message: "LOGIN_SUCCESS",
  },
  USER_CREATED:{
    code: StatusCodes.CREATED,
    message: "USER_CREATED",
  },
  STOCKS_SUCCESS: {
    code: StatusCodes.OK,
    message: "STOCKS_SUCCESS",
  },
  CRYPTO_DETAIL_SUCCESS: {
    code: StatusCodes.OK,
    message: "CRYPTO_DETAIL_SUCCESS",
  },
  CRYPTO_SEARCH_SUCCESS: {
    code: StatusCodes.OK,
    message: "CRYPTO_SEARCH_SUCCESS",
  },
  CURRENCY_DETAIL_SUCCESS: {
    code: StatusCodes.OK,
    message: "CURRENCY_DETAIL_SUCCESS",
  },
  CURRENCY_SEARCH_SUCCESS: {
    code: StatusCodes.OK,
    message: "CURRENCY_SEARCH_SUCCESS",
  },
  FUND_DETAIL_SUCCESS: {
    code: StatusCodes.OK,
    message: "FUND_DETAIL_SUCCESS",
  },
  FUND_SEARCH_SUCCESS: {
    code: StatusCodes.OK,
    message: "FUND_SEARCH_SUCCESS",
  },
  GOLD_DETAIL_SUCCESS: {
    code: StatusCodes.OK,
    message: "GOLD_DETAIL_SUCCESS",
  },
  GOLD_SEARCH_SUCCESS: {
    code: StatusCodes.OK,
    message: "GOLD_SEARCH_SUCCESS",
  },
  PORTFOLIO_LIST_SUCCESS: {
    code: StatusCodes.OK,
    message: "PORTFOLIO_LIST_SUCCESS",
  },
  PORTFOLIO_UPDATED_SUCCESS: {
    code: StatusCodes.OK,
    message: "PORTFOLIO_UPDATED_SUCCESS",
  },
  PORTFOLIO_DELETED_SUCCESS: {
    code: StatusCodes.OK,
    message: "PORTFOLIO_DELETED_SUCCESS",
  },
  PORTFOLIO_DETAILS_SUCCESS: {
    code: StatusCodes.OK,
    message: "PORTFOLIO_DETAILS_SUCCESS",
  },
  PORTFOLIO_ASSETS_SUCCESS: {
    code: StatusCodes.OK,
    message: "PORTFOLIO_ASSETS_SUCCESS",
  },
  PORTFOLIO_CREATED_SUCCESS:{
    code: StatusCodes.CREATED,
    message: "PORTFOLIO_CREATED_SUCCESS",
  },
  ASSET_ADDED_SUCCESS:{
    code: StatusCodes.CREATED,
    message: "ASSET_ADDED_SUCCESS",
  },
  ASSET_SELL_SUCCESS:{
    code: StatusCodes.OK,
    message: "ASSET_SELL_SUCCESS",
  },
  ASSET_DETAIL_SUCCESS:{
    code: StatusCodes.OK,
    message: "ASSET_DETAIL_SUCCESS",
  },
  PORTFOLIO_ASSETS_EMPTY_SUCCESS:{
    code: StatusCodes.OK,
    message: "PORTFOLIO_ASSETS_EMPTY_SUCCESS",
  },
  ADD_MONET_TO_BUDGET_SUCCESS:{
    code: StatusCodes.OK,
    message: "ADD_MONET_TO_BUDGET_SUCCESS",
  },
  DECREASE_MONET_FROM_BUDGET_SUCCESS:{
    code: StatusCodes.OK,
    message: "DECREASE_MONET_FROM_BUDGET_SUCCESS",
  },
  BUDGET_DETAILS_SUCCESS:{
    code: StatusCodes.OK,
    message: "BUDGET_DETAILS_SUCCESS",
  }
};

module.exports = { successCodes };
