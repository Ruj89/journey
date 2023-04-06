import Table from './table.js';

export default class StackingAmount extends Table {
  constructor(database) {
    super(database, 'stacking_amounts', [
      { name: 'value', type: 'REAL', nullable: false },
      { name: 'coin', type: 'INTEGER', nullable: false },
      { name: 'time', type: 'TIMESTAMP', nullable: false },
    ]);
  }
}
