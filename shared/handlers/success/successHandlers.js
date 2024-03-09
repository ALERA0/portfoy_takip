const { customSuccess } = require('./customSuccess');

const successHandler = (success, req, res, next) => {
  if (success instanceof customSuccess) {
    const localizedMessage = req.t(success.message);
    return res.status(success.successCode).send({
      status: 'success',
      successCode: success.successCode,
      message: localizedMessage,
    });
  }

  res.status(500).send({ status:"error", message: 'Unknown Error' });
};

module.exports = { successHandler };
