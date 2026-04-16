require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

// -------------------- 基本設定 --------------------
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // JavaScriptからクッキーを読み取れないようにする（XSS対策）
    secure: process.env.NODE_ENV === 'production', // 本番(HTTPS)環境ではtrueにする
    maxAge: 1000 * 60 * 60 * 24 // 1日有効
  }
}));

// -------------------- 認証ガード --------------------
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  console.log("🚫 未ログインのアクセスをブロックしました");
  res.redirect('/login');
}

// -------------------- ログイン --------------------
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      req.session.userId = user.id;
      return res.redirect('/home');
    }

    res.send('❌ ログイン失敗。メールアドレスかパスワードが違います。<a href="/login">戻る</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// -------------------- 新規登録 --------------------
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3)';
    await db.query(sql, [username, email, hash]);

    res.redirect('/login');
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.send('❌ そのメールアドレスは既に登録されています。<a href="/register">戻る</a>');
    }

    res.status(500).send('サーバーエラーが発生しました');
  }
});

// -------------------- ホーム（ログイン必須） --------------------
app.get('/home', isAuthenticated, async (req, res) => {
  try {
    const result = await db.query('SELECT username FROM users WHERE id = $1', [req.session.userId]);
    if (!result.rows[0]) {
      req.session.destroy(() => res.redirect('/login'));
      return;
    }
    res.render('home', { username: result.rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// -------------------- ログアウト --------------------
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// -------------------- サーバー起動 --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('--------------------------------------------');
  console.log(`🚀 サーバー起動成功！`);
  console.log(`🌐 ログイン: http://localhost:${PORT}/login`);
  console.log(`📝 新規登録: http://localhost:${PORT}/register`);
  console.log('--------------------------------------------');
});
