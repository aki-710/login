require('dotenv').config(); // 環境変数の読み込み（最優先）
const { Pool } = require('pg');

// データベース接続の設定
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 接続テスト用（エラーが起きた場合にログを出す設定）
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};