const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { readDB, writeDB } = require('./db/database');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'teamesp_super_secret_key_2024_pubg';

// ─── MULTER FILE UPLOAD ───────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error('Only images and videos allowed'));
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products.filter(p => p.active));
});

app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id == req.params.id && p.active);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.get('/api/settings', (req, res) => {
  const db = readDB();
  const { admin_password_hash, ...publicSettings } = db.settings;
  res.json(publicSettings);
});

app.get('/api/reviews', (req, res) => {
  const db = readDB();
  res.json(db.reviews.filter(r => !r.pending));
});

app.get('/api/faq', (req, res) => {
  const db = readDB();
  res.json(db.faq);
});

app.post('/api/reviews', (req, res) => {
  const { name, rating, comment } = req.body;
  if (!name || !rating || !comment) return res.status(400).json({ error: 'All fields required' });
  const db = readDB();
  const review = {
    id: Date.now(),
    name: name.trim(),
    avatar: name.trim().slice(0, 2).toUpperCase(),
    rating: Math.min(5, Math.max(1, parseInt(rating))),
    comment: comment.trim(),
    date: new Date().toISOString().split('T')[0],
    verified: false,
    pending: true
  };
  db.reviews.push(review);
  writeDB(db);
  res.json({ success: true, message: 'Review submitted for approval!' });
});

app.post('/api/orders', (req, res) => {
  const { product_id, customer_name, customer_contact, payment_method, pubg_id, notes } = req.body;
  if (!product_id || !customer_name || !customer_contact || !payment_method || !pubg_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const db = readDB();
  const product = db.products.find(p => p.id == product_id && p.active);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const order = {
    id: `ESP-${Date.now()}`,
    product_id,
    product_name: product.name,
    price_pkr: product.price_pkr,
    price_usdt: product.price_usdt,
    customer_name: customer_name.trim(),
    customer_contact: customer_contact.trim(),
    payment_method,
    pubg_id: pubg_id.trim(),
    notes: notes?.trim() || '',
    status: 'pending',
    created_at: new Date().toISOString()
  };
  db.orders.push(order);
  writeDB(db);
  res.json({ success: true, order_id: order.id, message: 'Order placed successfully!' });
});

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const db = readDB();
  const msg = message.toLowerCase().trim();
  let reply = '';
  const products = db.products.filter(p => p.active);

  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('kitna')) {
    reply = `💰 <b>Current Prices:</b><br>${products.map(p => `• ${p.name}: <b>PKR ${Number(p.price_pkr).toLocaleString()}</b> / $${p.price_usdt} USDT`).join('<br>')}<br><br>Click <b>Buy Now</b> on any plan to order!`;
  } else if (msg.includes('payment') || msg.includes('pay') || msg.includes('send money')) {
    const s = db.settings;
    reply = `💳 <b>Payment Methods:</b><br>• <b>Binance Pay (USDT):</b> ID: ${s.binance_id} (${s.binance_name})<br>• <b>EasyPaisa:</b> ${s.easypaisa} (${s.easypaisa_name})<br>• <b>JazzCash:</b> ${s.jazzcash} (${s.jazzcash_name})<br><br>After payment, send your screenshot on WhatsApp or Telegram! ✅`;
  } else if (msg.includes('delivery') || msg.includes('time') || msg.includes('fast') || msg.includes('kab')) {
    reply = `⚡ <b>Delivery Time:</b> ${db.settings.delivery_time}<br><br>After payment confirmation, your subscription is activated almost instantly! We operate 24/7.`;
  } else if (msg.includes('safe') || msg.includes('secure') || msg.includes('scam') || msg.includes('trust')) {
    reply = `🛡️ <b>100% Safe & Secure!</b><br><br>We have <b>${db.settings.happy_customers}</b> happy customers with a <b>${db.settings.rating}</b> rating. We NEVER ask for your password!`;
  } else if (msg.includes('contact') || msg.includes('support') || msg.includes('help')) {
    const s = db.settings;
    reply = `📞 <b>Contact Us:</b><br>• Telegram: ${s.telegram}<br>• WhatsApp: ${s.whatsapp}<br>• Instagram: ${s.instagram}<br>• Discord: ${s.discord}<br><br>We reply within minutes! 🚀`;
  } else if (msg.includes('refund') || msg.includes('cancel')) {
    reply = `⚠️ <b>Refund Policy:</b><br><br>All subscriptions are <b>non-refundable</b> once activated. Please read our FAQ before purchasing. Contact support immediately if any issue!`;
  } else if (msg.includes('pubg') || msg.includes('game') || msg.includes('subscription') || msg.includes('plan')) {
    reply = `🎮 <b>Our Subscriptions:</b><br>${products.map(p => `• <b>${p.name}</b> — PKR ${Number(p.price_pkr).toLocaleString()} / $${p.price_usdt}`).join('<br>')}<br><br>All plans include instant delivery and 24/7 support!`;
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('salaam') || msg.includes('aoa')) {
    reply = `👋 <b>Welcome to Team ESP!</b><br><br>I'm your support assistant. How can I help you today?<br><br>• 💰 Ask about <b>prices</b><br>• 💳 Ask about <b>payment</b><br>• ⚡ Ask about <b>delivery</b><br>• 🛡️ Ask about <b>safety</b><br>• 📞 Ask for <b>support</b>`;
  } else {
    reply = `🤖 I'm here to help! Try asking about:<br>• <b>Prices</b> — subscription costs<br>• <b>Payment</b> — how to pay<br>• <b>Delivery</b> — how fast<br>• <b>Safety</b> — is it safe?<br>• <b>Contact</b> — reach our team<br><br>Or contact us on <b>WhatsApp/Telegram</b>! 🚀`;
  }

  db.chat_messages = db.chat_messages || [];
  db.chat_messages.push({ message: message.trim(), reply, timestamp: new Date().toISOString() });
  if (db.chat_messages.length > 1000) db.chat_messages = db.chat_messages.slice(-500);
  writeDB(db);
  res.json({ reply });
});

// ─── ADMIN API ────────────────────────────────────────────────────────────────

app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  const db = readDB();
  const valid = await bcrypt.compare(password, db.settings.admin_password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  const db = readDB();
  res.json({
    products: db.products,
    reviews: db.reviews,
    orders: db.orders,
    settings: db.settings,
    faq: db.faq,
    stats: {
      total_orders: db.orders.length,
      pending_orders: db.orders.filter(o => o.status === 'pending').length,
      completed_orders: db.orders.filter(o => o.status === 'completed').length,
      total_reviews: db.reviews.length,
      pending_reviews: db.reviews.filter(r => r.pending).length
    }
  });
});

app.post('/api/admin/products', authenticateToken, (req, res) => {
  const db = readDB();
  const product = { ...req.body, id: Date.now(), active: true, images: [], video_url: '', gallery: [], created_at: new Date().toISOString() };
  db.products.push(product);
  writeDB(db);
  res.json({ success: true, product });
});

app.put('/api/admin/products/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.products[idx] = { ...db.products[idx], ...req.body };
  writeDB(db);
  res.json({ success: true, product: db.products[idx] });
});

app.delete('/api/admin/products/:id', authenticateToken, (req, res) => {
  const db = readDB();
  db.products = db.products.filter(p => p.id != req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ─── FILE UPLOAD ENDPOINTS ───────────────────────────────────────────────────

// Upload main product image
app.post('/api/admin/products/:id/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  db.products[idx].main_image = url;
  writeDB(db);
  res.json({ success: true, url });
});

// Upload gallery images (multiple)
app.post('/api/admin/products/:id/upload-gallery', authenticateToken, upload.array('gallery', 10), (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  db.products[idx].gallery = [...(db.products[idx].gallery || []), ...urls];
  writeDB(db);
  res.json({ success: true, urls, gallery: db.products[idx].gallery });
});

// Delete a gallery image
app.delete('/api/admin/products/:id/gallery', authenticateToken, (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { url } = req.body;
  db.products[idx].gallery = (db.products[idx].gallery || []).filter(u => u !== url);
  // Try to delete file from disk
  try {
    const filePath = path.join(__dirname, 'public', url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch(e) {}
  writeDB(db);
  res.json({ success: true, gallery: db.products[idx].gallery });
});

app.put('/api/admin/orders/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.orders[idx] = { ...db.orders[idx], ...req.body };
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/admin/orders/:id', authenticateToken, (req, res) => {
  const db = readDB();
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/admin/reviews/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const idx = db.reviews.findIndex(r => r.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.reviews[idx] = { ...db.reviews[idx], ...req.body };
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/admin/reviews/:id', authenticateToken, (req, res) => {
  const db = readDB();
  db.reviews = db.reviews.filter(r => r.id != req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  const db = readDB();
  if (req.body.new_password) {
    req.body.admin_password_hash = await bcrypt.hash(req.body.new_password, 10);
    delete req.body.new_password;
  }
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/faq', authenticateToken, (req, res) => {
  const db = readDB();
  const item = { ...req.body, id: Date.now() };
  db.faq.push(item);
  writeDB(db);
  res.json({ success: true, item });
});

app.put('/api/admin/faq/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const idx = db.faq.findIndex(f => f.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.faq[idx] = { ...db.faq[idx], ...req.body };
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/admin/faq/:id', authenticateToken, (req, res) => {
  const db = readDB();
  db.faq = db.faq.filter(f => f.id != req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ─── PAGE ROUTES ──────────────────────────────────────────────────────────────

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Express 5 wildcard syntax
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Team ESP running on port ${PORT}`));
