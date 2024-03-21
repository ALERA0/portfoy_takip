const successHandler = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (data && data.message) {
      // Translate the success message based on the user's language
      let localizedMessage;
      if (res.statusCode === 200) {
        data.message = req.t(data.message);
        localizedMessage = req.t(`success:${data.message}`);
      } else {
        localizedMessage = req.t(`${data.message}`);
      }

      data.message = localizedMessage; // Update the message with the localized one
    }

    originalJson.call(res, data);
  };

  next();
};

module.exports = { successHandler };
