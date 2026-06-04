const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '236921470',
  database: 'smartDiet'
});

client.connect().then(async () => {
  const res = await client.query("SELECT id, name, calories, unit FROM foods WHERE name ILIKE '%domates%' OR name ILIKE '%salatalık%'");
  console.log('Foods:', res.rows);
  client.end();
}).catch(err => {
  console.error(err);
  client.end();
});
