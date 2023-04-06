export default class StackingAmount {
  /**
   * Generate a new action
   * @param {number} value Value of the stacking
   * @param {number} coin Identifier of the coin related to stacking
   * @param {Date} time When stacking has been executed
   * @param {number} id Stacking movement identifier
   */
  constructor(value, coin, time, id = null) {
    this.id = id;
    this.value = value;
    this.coin = coin;
    this.time = time;
  }
}
