module.exports.default = class Coin {
  /**
   * Generate a new coin
   * @param {string} name Coin friendly name
   * @param {string} ticker Coin ticker for Coinbase API
   * @param {number} id Action identifier
   */
  constructor(name, ticker, id = null) {
    this.id = id;
    this.name = name;
    this.ticker = ticker;
  }
};
