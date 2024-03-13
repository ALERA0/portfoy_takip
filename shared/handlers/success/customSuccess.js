class customSuccess {
  constructor(successType, data = {}) {
    this.successCode = successType.code;
    this.message = successType.message; // Store the message key instead of the actual message
    this.data = data;
    this.status = "success";
    Object.setPrototypeOf(this, customSuccess.prototype);
  }
}

module.exports = { customSuccess };
