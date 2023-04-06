import Table from './table.js';

export default class MiningShare extends Table {
  constructor(database) {
    super(database, 'mining_share', [
      { name: 'amount', type: 'REAL', nullable: false },
      { name: 'start_time', type: 'TIMESTAMP', nullable: false },
      { name: 'end_time', type: 'TIMESTAMP', nullable: false },
    ]);
  }
}
