module.exports.default = class User {
  /**
   * Generate a new user
   * @param {number} id User identifier
   * @param {string} name User name
   * @param {number} defaultHashRate Default mining rig hashrate [MH/s]
   */
  constructor(id = null, name, defaultHashRate) {
    this.id = id;
    this.name = name;
    this.defaultHashRate = defaultHashRate;
  }
};
