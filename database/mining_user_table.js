import Table from './table.js';

export default class MiningUser extends Table {
  constructor(database) {
    super(database, 'mining_users', [
      { name: 'name', type: 'TEXT', nullable: false },
      { name: 'defaultHashRate', type: 'REAL', nullable: false },
      { name: 'telegramName', type: 'TEXT', nullable: false },
    ]);
  }
}
