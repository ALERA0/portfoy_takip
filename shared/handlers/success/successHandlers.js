const successHandler = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (data && data.message) {
      // Translate the success message based on the user's language
      const localizedMessage = req.t(`success:${data.message}`);
      data.message = localizedMessage; // Update the message with the localized one
    }

    originalJson.call(res, data);
  };

  next();
};

module.exports = { successHandler };
