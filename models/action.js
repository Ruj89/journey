module.exports.default = class Action {
  /**
   * Generate a new action
   * @param {string} type Action type [Start, End]
   * @param {Date} date When action has been executed
   * @param {number} user Identifier of the user that executed the action
   * @param {number} id Action identifier
   */
  constructor(type, date, user, id = null) {
    this.id = id;
    this.type = type;
    this.date = date;
    this.user = user;
  }
};
