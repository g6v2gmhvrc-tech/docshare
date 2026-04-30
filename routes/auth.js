const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { users } = require('../db');

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'avatar_' + Date.now() + ext);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片'));
  }
});

router.post('/register', avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: '请填写所有必填项' });
    if (password.length < 6)
      return res.status(400).json({ error: '密码至少6位' });

    const existingEmail = await users.findOne({ email });
    if (existingEmail) return res.status(400).json({ error: '该邮箱已注册' });

    const existingName = await users.findOne({ username });
    if (existingName) return res.status(400).json({ error: '该用户名已被使用' });

    const hashed = await bcrypt.hash(password, 10);
    const avatar = req.file ? '/uploads/' + req.file.filename : null;
    const now = new Date().toISOString();

    const user = await users.insert({ username, email, password: hashed, avatar, created_at: now });
    const sessionUser = { id: user._id, username: user.username, email: user.email, avatar: user.avatar };
    req.session.user = sessionUser;
    res.json({ success: true, user: sessionUser });
  } catch (err) {
    if (err.message && err.message.includes('unique')) {
      return res.status(400).json({ error: '该邮箱或用户名已被使用' });
    }
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: '请填写邮箱和密码' });

    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: '邮箱或密码错误' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: '邮箱或密码错误' });

    const sessionUser = { id: user._id, username: user.username, email: user.email, avatar: user.avatar };
    req.session.user = sessionUser;
    res.json({ success: true, user: sessionUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  if (req.session.user) res.json({ user: req.session.user });
  else res.json({ user: null });
});

module.exports = router;
