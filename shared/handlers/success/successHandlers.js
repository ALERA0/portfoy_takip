const i18next = require("../../i18next/i18nextConfig"); // Dosya yolunu düzeltin

const successHandler = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const localizedMessage = req.t(data.message);
    if (data && data.message) {
      // Translate the success message based on the user's language
      data.message = localizedMessage;
      console.log(data.message);
    }

    originalJson.call(res, data);
  };

  next();
};

module.exports = { successHandler };
