export default class User {
  /**
   * Generate a new user
   * @param {string} name User name
   * @param {number} defaultHashRate Default mining rig hashrate [MH/s]
   * @param {number} telegramName Telegram user name
   * @param {number} id User identifier
   */
  constructor(name, defaultHashRate, telegramName, id = null) {
    this.id = id;
    this.name = name;
    this.defaultHashRate = defaultHashRate;
    this.telegramName = telegramName;
  }
}
