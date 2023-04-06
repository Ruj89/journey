export default class Coin {
  /**
   * Generate a new coin
   * @param {string} name Coin friendly name
   * @param {string} ticker Coin ticker for Coinbase API
   * @param {string} vs Coin evaluation ticker for Coinbase API (null=EUR)
   * @param {number} id Action identifier
   */
  constructor(name, ticker, vs = null, id = null) {
    this.id = id;
    this.name = name;
    this.ticker = ticker;
    this.vs = vs;
  }
}
