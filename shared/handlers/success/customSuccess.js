class customSuccess {
  constructor(successType, data = {}) {
    console.log(successType);
    this.successCode = successType.code;
    this.message = successType.message;
    this.data = data;
    this.status = "success"
    Object.setPrototypeOf(this, customSuccess.prototype);
  }
}

module.exports = { customSuccess };
