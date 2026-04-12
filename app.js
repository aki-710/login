require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db'); 
const app = express();

// --- 設定 ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); 
app.use(session({
  secret: 'your-secret-key', 
  resave: false,
  saveUninitialized: false
}));

// --- ガード機能（認証チェックのミドルウェア） ---
// これをルートの間に挟むことで、未ログインユーザーを弾きます
function isAuthenticated(req, res, next) {
// ここで「!」が抜けていたり、条件が間違っているとスルーされます
if (req.session.userId) { 
    return next(); // ログインしていればOK
} else {
    console.log("🚫 未ログインのアクセスをブロックしました");
    res.redirect('/login'); // ログインしていなければ強制送還
  }
}

// --- 1. ログイン画面関連 ---

app.get('/login', (req, res) => {
  res.render('login'); 
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        req.session.userId = user.id;
        return res.redirect('/home');
      }
    }
    res.send('❌ ログイン失敗。メールアドレスかパスワードが違います。<a href="/login">戻る</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// --- 2. 新規登録画面関連 ---

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id';
    await db.query(sql, [username, email, hash]);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.send('❌ そのメールアドレスは既に登録されています。<a href="/register">戻る</a>');
    } else {
      res.status(500).send('サーバーエラーが発生しました');
    }
  }
});

// --- 3. ログイン後のホーム画面（ガード付き） ---

// isAuthenticated を第2引数に入れることで、このページは守られます
app.get('/home', isAuthenticated, async (req, res) => {
  try {
    const result = await db.query('SELECT username FROM users WHERE id = $1', [req.session.userId]);
    const user = result.rows[0];

    res.render('home', {
      username: user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('エラーが発生しました');
  }
});

// --- 4. ログアウト機能 ---

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/login'); 
  });
});

// --- 5. サーバー起動 ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log('--------------------------------------------');
  console.log(`🚀 サーバー起動成功！`);
  console.log(`🌐 ログインはこちら: http://localhost:${PORT}/login`);
  console.log(`📝 新規登録はこちら: http://localhost:${PORT}/register`);
  console.log('--------------------------------------------');
});