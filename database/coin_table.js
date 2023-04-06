import Table from './table.js';

export default class Coin extends Table {
  constructor(database) {
    super(database, 'coins', [
      { name: 'name', type: 'TEXT', nullable: false },
      { name: 'ticker', type: 'TEXT', nullable: false },
      { name: 'vs', type: 'TEXT', nullable: true, default: 'NULL' },
    ]);
  }
};
