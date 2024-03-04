class customSuccess {
  constructor(successType, data = {}) {
    this.successCode = successType.code;
    this.successMessage = successType.message;
    this.data = data;
    Object.setPrototypeOf(this, customSuccess.prototype);
  }
}

module.exports = { customSuccess };
