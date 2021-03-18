module.exports.default = class Share {
  /**
   * Generate a new share
   * @param {number} id Share identifier
   * @param {number} amount Amount of minet cryptocurrency
   * @param {Date} start_time When share calculation starts
   * @param {Date} end_time When share calculation ends
   */
  constructor(id = null, amount, start_time, end_time) {
    this.id = id;
    this.amount = amount;
    this.start_time = start_time;
    this.end_time = end_time;
  }
};
