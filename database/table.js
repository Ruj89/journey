export default class Table {
  #database;
  #name;
  #fields;

  constructor(database, name, fields) {
    this.#database = database;
    this.#name = name;
    this.#fields = fields;
    this.initializeTable();
  }

  initializeField(field) {
    let stringArray = [];
    stringArray.push(field.name);
    stringArray.push(field.type);
    if (field.default) stringArray.push(`DEFAULT ${field.default}`);
    if (field.nullable != undefined && !field.nullable)
      stringArray.push('NOT NULL');
    let foreignKey;
    if (field.references)
      foreignKey = `FOREIGN KEY(${field.name}) REFERENCES ${field.references}`;
    return { fields: stringArray.join(' '), foreignKey };
  }

  initializeTable() {
    let result = this.#fields.map(this.initializeField);
    let foreignKeys = result.map(result => result.foreignKey).filter(fk => fk != undefined);
    this.#database.run(
      `\
            CREATE TABLE "${this.#name}" ( \
                "id"	INTEGER NOT NULL, \
                ${result.map(result => result.fields).join(',')}, \
                ${foreignKeys.length > 0 ? `${foreignKeys.join(',')},` : ''} \
                PRIMARY KEY("id" AUTOINCREMENT) \
            )`
    );
  }

  create(instance) {
    return new Promise((resolve, reject) => {
      this.#database.run(
        `INSERT INTO ${this.#name} VALUES (NULL, ${this.#fields.map(f => "?").join(", ")})`,
        this.#fields.map(f => {
          let result = instance[f.name];
          if (result === undefined && f.default)
            result = f.default;
          return result;
        }),
        (error) => {
          if (!error) resolve();
          else reject(error);
        }
      );
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      this.#database.all(`SELECT * FROM ${this.#name}`, (error, instances) => {
        if (!error)
          resolve(instances);
        else reject(error);
      });
    });
  }
}
