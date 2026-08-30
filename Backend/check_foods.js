const { Client } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '236921470',
  database: 'smartDiet'
});

client.connect().then(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'ibrahim_tkn033@hotmail.com']);
  console.log('Dietitian password reset.');

  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ibrahim_tkn033@hotmail.com', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.access_token;
  console.log('Dietitian Login Success:', !!token);

  const imagePath = 'C:/Users/ibrah/.gemini/antigravity/brain/291f2001-12df-46d1-88a7-3557f5416370/.user_uploaded/media_1787863375414.jpg';
  const buffer = fs.readFileSync(imagePath);
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('image', blob, 'meal.jpg');

  const scanRes = await fetch('http://localhost:3000/api/ai-assistant/scan-meal', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
  const scanData = await scanRes.json();
  console.log('SCAN DATA:', JSON.stringify(scanData, null, 2));

  client.end();
}).catch(err => {
  console.error(err);
  client.end();
});
