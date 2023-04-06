import Table from './table.js';

export default class MiningAction extends Table {
  constructor(database) {
    super(database, 'mining_action', [
      {
        name: 'type',
        type: "TEXT CHECK( type IN ('Start', 'End') )",
        nullable: false,
      },
      { name: 'date', type: 'TIMESTAMP', nullable: false },
      {
        name: 'user',
        type: 'INTEGER',
        nullable: false,
        references: 'mining_users(id)',
      },
    ]);
  }
}
