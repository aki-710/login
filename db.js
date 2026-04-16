// db.js
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // 本番ではプロセス終了の代わりに再起動戦略を検討してください
  process.exit(1);
});

// 起動時の接続テストは任意で有効化
if (process.env.DB_TEST_CONNECTION !== 'false') {
  (async () => {
    try {
      const client = await pool.connect();
      client.release();
      console.log('Postgres connection OK');
    } catch (err) {
      console.error('Postgres connection failed', err);
    }
  })();
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
