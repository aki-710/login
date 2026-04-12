// db.js の正しい冒頭
require('dotenv').config(); // これが一番上でないと process.env が空になる
const { Pool } = require('pg');

console.log("@bZp%*DSxE&sBeXw1#JX", process.env.DB_PASSWORD); // ここで確認

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};