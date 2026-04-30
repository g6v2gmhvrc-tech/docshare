const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { files } = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'file' ? 'doc_' : 'img_';
    cb(null, prefix + Date.now() + '_' + Math.random().toString(36).slice(2,7) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('展示图只允许图片格式'));
    } else {
      cb(null, true);
    }
  }
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: '请先登录' });
  next();
}

// GET /api/files
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category && category !== 'all') query.category = category;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ title: re }, { description: re }, { tags: re }];
    }
    const result = await files.find(query).sort({ created_at: -1 });
    res.json(result.map(f => ({
      ...f,
      id: f._id,
      images: Array.isArray(f.images) ? f.images : JSON.parse(f.images || '[]'),
      tags: Array.isArray(f.tags) ? f.tags : (f.tags ? f.tags.split(',') : [])
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/files/:id
router.get('/:id', async (req, res) => {
  try {
    const file = await files.findOne({ _id: req.params.id });
    if (!file) return res.status(404).json({ error: '文件不存在' });
    res.json({
      ...file,
      id: file._id,
      images: Array.isArray(file.images) ? file.images : JSON.parse(file.images || '[]'),
      tags: Array.isArray(file.tags) ? file.tags : (file.tags ? file.tags.split(',') : [])
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/files
router.post('/', requireAuth, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 8 }
]), async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!title) return res.status(400).json({ error: '请填写标题' });
    if (!req.files || !req.files.file) return res.status(400).json({ error: '请上传文件' });


    const docFile = req.files.file[0];
    const imgPaths = req.files.images.map(f => '/uploads/' + f.filename);
    const tagArr = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const record = await files.insert({
      title,
      description: description || '',
      category: category || 'other',
      tags: tagArr,
      filename: docFile.filename,
      original_name: docFile.originalname,
      file_size: docFile.size,
      images: imgPaths,
      user_id: req.session.user.id,
      username: req.session.user.username,
      user_avatar: req.session.user.avatar,
      downloads: 0,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, id: record._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '上传失败: ' + err.message });
  }
});

// GET /api/files/:id/download  (using GET so <a> link works)
router.get('/:id/download', async (req, res) => {
  try {
    const file = await files.findOne({ _id: req.params.id });
    if (!file) return res.status(404).json({ error: '文件不存在' });

    await files.update({ _id: file._id }, { $inc: { downloads: 1 } });

    const filePath = path.join(__dirname, '../public/uploads', file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件已被删除' });

    res.download(filePath, file.original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
