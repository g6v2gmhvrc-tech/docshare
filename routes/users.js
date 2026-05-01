const express = require('express');
const { users, files } = require('../db');
const router = express.Router();

// GET /api/users/:id - get user profile + their files
router.get('/:id', async (req, res) => {
  try {
    const user = await users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const userFiles = await files.find({ user_id: req.params.id }).sort({ created_at: -1 });
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        created_at: user.created_at
      },
      files: userFiles.map(f => ({
        ...f,
        id: f._id,
        images: Array.isArray(f.images) ? f.images : [],
        tags: Array.isArray(f.tags) ? f.tags : []
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
