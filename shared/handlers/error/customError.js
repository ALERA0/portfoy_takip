class customError extends Error {
    constructor(errorType) {
      super(errorType.message);
      this.errorCode = errorType.code;
      this.message = errorType.message;
      console.log(errorType.code, errorType.message)
      Object.setPrototypeOf(this, customError.prototype);
    }
  }
  
  module.exports = { customError };
  