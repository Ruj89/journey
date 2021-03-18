module.exports.default = class User {
  /**
   * Generate a new user
   * @param {string} name User name
   * @param {number} defaultHashRate Default mining rig hashrate [MH/s]
   * @param {number} id User identifier
   */
  constructor(name, defaultHashRate, id = null) {
    this.id = id;
    this.name = name;
    this.defaultHashRate = defaultHashRate;
  }
};
