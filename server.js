import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 环境配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 加载根目录下的 .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. 静态资源挂载：确保通过 http://localhost:3001/uploads/xxx 可以访问图片

app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 数据库连接池 ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // 请确保 .env.local 里的密码正确
  database: process.env.DB_NAME || 'lixin_lab_db',
  waitForConnections: true,
  connectionLimit: 10
});
const db = pool.promise();

// --- API 接口 ---

// [接口 1] 获取小组详情 (成员 + 作品)
app.get('/api/team/:group', async (req, res) => {
  const { group } = req.params;
  try {
    const [members] = await db.query("SELECT * FROM team_members WHERE group_type = ?", [group]);
    const [posts] = await db.query("SELECT * FROM team_posts WHERE group_type = ?", [group]);
    res.json({ members, posts });
  } catch (err) {
    console.error("❌ 数据库查询失败:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// [接口 2] 获取九宫格图片
app.get('/api/gallery/:group', async (req, res) => {
  const { group } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM gallery WHERE group_name = ? ORDER BY id DESC", [group]);
    res.json(rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// [接口 3] 获取详情、评分与评论 (支持九宫格全员评论)
app.get('/api/detail/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  try {
    const [rRows] = await db.query("SELECT AVG(rating) as avgRating FROM ratings WHERE target_id = ? AND target_type = ?", [id, type]);
    const avgRating = rRows[0].avgRating ? parseFloat(rRows[0].avgRating).toFixed(1) : "5.0";

    let comments;
    if (type === 'gallery') {
      const query = `
        SELECT c.* FROM comments c
        LEFT JOIN team_members m ON c.member_id = m.id
        LEFT JOIN team_posts p ON c.post_id = p.id
        WHERE c.gallery_group = ? OR m.group_type = ? OR p.group_type = ?
        ORDER BY c.created_at DESC
      `;
      const [rows] = await db.query(query, [id, id, id]);
      comments = rows;
    } else {
      const field = type === 'post' ? 'post_id' : 'member_id';
      const [rows] = await db.json(`SELECT * FROM comments WHERE ${field} = ? ORDER BY created_at DESC`, [id]);
      comments = rows;
    }
    res.json({ avgRating, comments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// [接口 4] 提交评论
app.post('/api/comments', async (req, res) => {
  const { post_id, member_id, gallery_group, user_name, content } = req.body;
  try {
    await db.query(
      "INSERT INTO comments (post_id, member_id, gallery_group, user_name, content) VALUES (?, ?, ?, ?, ?)",
      [post_id || null, member_id || null, gallery_group || null, user_name, content]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// [接口 5] 评分接口
app.post('/api/rate', async (req, res) => {
  const { target_id, target_type, rating } = req.body;
  try {
    await db.query("INSERT INTO ratings (target_id, target_type, rating) VALUES (?, ?, ?)", [target_id, target_type, rating]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// [接口 6] 投稿新作品
app.post('/api/upload-post', async (req, res) => {
  const { title, content, media_url, group_type } = req.body;
  try {
    await db.query("INSERT INTO team_posts (title, content, media_url, group_type) VALUES (?, ?, ?, ?)", [title, content, media_url, group_type]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 启动服务器 ---
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 璃心燃点实验室后端已就绪:`);
  console.log(`📡 API 地址: http://localhost:${PORT}/api`);
  console.log(`📂 图片资源: http://localhost:${PORT}/uploads\n`);
});