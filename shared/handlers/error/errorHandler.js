const { customError } = require("./customError");

const errorHandler = (err, req, res, next) => {
    if (err instanceof customError) {
      const localizedMessage = req.t(err.message);
      console.log(err)
      return res
        .status(err.errorCode)
        .json({
          error: true,
          status: "error",
          errorCode: err.errorCode,
          message: localizedMessage,
        });
    }
      res.status(500).send({status:"error", message: err.message });
  };
  
  module.exports = { errorHandler };
  