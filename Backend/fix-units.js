const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'smart_diet',
  ssl: false
});
ds.initialize().then(async () => {
  await ds.query("UPDATE foods SET unit = 'gram' WHERE unit = '100g'");
  console.log('Fixed foods');
  process.exit(0);
}).catch(console.error);
