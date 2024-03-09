class customError extends Error {
    constructor(errorType) {
      super(errorType.message);
      this.errorCode = errorType.code;
      this.message = errorType.message;
      Object.setPrototypeOf(this, customError.prototype);
    }
  }
  
  module.exports = { customError };
  