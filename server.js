const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const rateLimit = require('express-rate-limit');
const { readDB, writeDB } = require('./db/database');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'teamesp_super_secret_2024';

// ─── Security headers ─────────────────────────────────────────────────────────
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('X-XSS-Protection','1; mode=block');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  next();
});

// ─── Multer ───────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname,'public','uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir,{recursive:true});

const storage = multer.diskStorage({
  destination: (_,__,cb) => cb(null,uploadsDir),
  filename: (_,file,cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null,`${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10*1024*1024 },
  fileFilter: (_,file,cb) => {
    const ok = /jpeg|jpg|png|gif|webp|svg|mp4|mov|webm/.test(path.extname(file.originalname).toLowerCase());
    cb(null,ok);
  }
});

app.use(cors());
app.use(express.json({ limit:'2mb' }));
app.use(express.urlencoded({ extended:true, limit:'2mb' }));
app.use(express.static(path.join(__dirname,'public')));

// Rate limiting
const limiter      = rateLimit({ windowMs:15*60*1000, max:300, standardHeaders:true });
const loginLimiter = rateLimit({ windowMs:15*60*1000, max:10,  message:'Too many login attempts' });
app.use('/api/', limiter);

// ─── Auth middleware ──────────────────────────────────────────────────────────
function auth(req,res,next){
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({error:'Access denied'});
  try { req.admin = jwt.verify(token,JWT_SECRET); next(); }
  catch { res.status(403).json({error:'Invalid token'}); }
}

// Input sanitiser (basic XSS)
function san(str){ return String(str||'').replace(/[<>]/g,'').trim().slice(0,2000); }

// ═══════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════

app.get('/api/product',   (_,res)=>{ const db=readDB(); res.json(db.product); });
app.get('/api/features',  (_,res)=>{ const db=readDB(); res.json(db.features.filter(f=>f.active)); });
app.get('/api/versions',  (_,res)=>{ const db=readDB(); res.json(db.versions); });
app.get('/api/reviews',   (_,res)=>{ const db=readDB(); res.json(db.reviews.filter(r=>!r.pending)); });
app.get('/api/faq',       (_,res)=>{ const db=readDB(); res.json(db.faq); });
app.get('/api/content',   (_,res)=>{ const db=readDB(); res.json(db.content||{}); });

app.get('/api/settings', (_,res)=>{
  const db=readDB();
  const { admin_password_hash,...pub } = db.settings;
  res.json(pub);
});

app.post('/api/orders', (req,res)=>{
  const { items, customer_name, customer_contact, payment_method, pubg_id, notes } = req.body;
  if (!items?.length||!customer_name||!customer_contact||!payment_method)
    return res.status(400).json({error:'All fields required'});
  const db=readDB();
  const order = {
    id:`ESP-${Date.now()}`,
    items: items.map(i=>({...i,label:san(i.label)})),
    total_pkr:  items.reduce((s,i)=>s+i.price_pkr*(i.qty||1),0),
    total_usdt: items.reduce((s,i)=>s+i.price_usdt*(i.qty||1),0),
    customer_name:    san(customer_name),
    customer_contact: san(customer_contact),
    payment_method:   san(payment_method),
    pubg_id:          san(pubg_id||''),
    notes:            san(notes||''),
    status:'pending', created_at:new Date().toISOString()
  };
  db.orders.push(order); writeDB(db);
  res.json({success:true, order_id:order.id});
});

app.post('/api/reviews', (req,res)=>{
  const { name, rating, comment } = req.body;
  if (!name||!rating||!comment) return res.status(400).json({error:'All fields required'});
  const db=readDB();
  db.reviews.push({
    id:Date.now(), name:san(name), avatar:san(name).slice(0,2).toUpperCase(),
    rating:Math.min(5,Math.max(1,parseInt(rating))), comment:san(comment),
    date:new Date().toISOString().split('T')[0], verified:false, pending:true
  });
  writeDB(db); res.json({success:true});
});

app.post('/api/chat', (req,res)=>{
  const { message } = req.body;
  if (!message) return res.status(400).json({error:'Message required'});
  const db=readDB(); const msg=san(message).toLowerCase(); const s=db.settings; const p=db.product;
  let reply='';
  if (msg.includes('price')||msg.includes('cost')||msg.includes('kitna'))
    reply=`💰 <b>Prices:</b><br>${p.tiers.map(t=>`• ${t.label}: <b>PKR ${Number(t.price_pkr).toLocaleString()}</b> / $${t.price_usdt} USDT`).join('<br>')}`;
  else if (msg.includes('payment')||msg.includes('pay'))
    reply=`💳 Binance: ${s.binance_id} | EasyPaisa: ${s.easypaisa} | JazzCash: ${s.jazzcash}`;
  else if (msg.includes('delivery')||msg.includes('fast'))
    reply=`⚡ Delivery in <b>${s.delivery_time}</b> after payment. We run 24/7!`;
  else if (msg.includes('safe')||msg.includes('scam'))
    reply=`🛡️ <b>100% Safe!</b> ${s.happy_customers} happy customers. We NEVER ask for your password!`;
  else if (msg.includes('contact')||msg.includes('support'))
    reply=`📞 Telegram: ${s.telegram} | WhatsApp: ${s.whatsapp}`;
  else if (msg.includes('hello')||msg.includes('hi')||msg.includes('salaam'))
    reply=`👋 <b>Welcome to Team ESP!</b> Ask me about <b>prices</b>, <b>payment</b>, or <b>delivery</b>!`;
  else
    reply=`🤖 Ask about: <b>prices</b>, <b>payment</b>, <b>delivery</b>, <b>safety</b>, or <b>contact</b>`;
  db.chat_messages=db.chat_messages||[];
  db.chat_messages.push({message:san(message),reply,timestamp:new Date().toISOString()});
  if (db.chat_messages.length>500) db.chat_messages=db.chat_messages.slice(-300);
  writeDB(db); res.json({reply});
});

// ═══════════════════════════════════════════════════
// ADMIN API
// ═══════════════════════════════════════════════════

app.post('/api/admin/login', loginLimiter, async(req,res)=>{
  const { password }=req.body;
  if (!password) return res.status(400).json({error:'Password required'});
  const db=readDB();
  const valid=await bcrypt.compare(password,db.settings.admin_password_hash);
  if (!valid) return res.status(401).json({error:'Invalid password'});
  const token=jwt.sign({admin:true},JWT_SECRET,{expiresIn:'24h'});
  res.json({token});
});

app.get('/api/admin/dashboard', auth, (req,res)=>{
  const db=readDB();
  res.json({
    product:db.product, reviews:db.reviews, orders:db.orders,
    settings:db.settings, faq:db.faq, content:db.content,
    features:db.features, versions:db.versions,
    stats:{
      total_orders:db.orders.length,
      pending_orders:db.orders.filter(o=>o.status==='pending').length,
      completed_orders:db.orders.filter(o=>o.status==='completed').length,
      total_reviews:db.reviews.length,
      pending_reviews:db.reviews.filter(r=>r.pending).length
    }
  });
});

// Product
app.put('/api/admin/product', auth, (req,res)=>{
  const db=readDB(); db.product={...db.product,...req.body}; writeDB(db);
  res.json({success:true,product:db.product});
});

// Logo + favicon upload
app.post('/api/admin/upload/logo',    auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  db.settings.logo_url=url; writeDB(db); res.json({success:true,url});
});
app.post('/api/admin/upload/favicon', auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  db.settings.favicon_url=url; writeDB(db); res.json({success:true,url});
});

// Generic icon upload
app.post('/api/admin/upload/icon', auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  res.json({success:true, url:`/uploads/${req.file.filename}`});
});

// Product image upload
app.post('/api/admin/product/upload-image', auth, upload.single('image'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  db.product.main_image=url; writeDB(db); res.json({success:true,url});
});
app.post('/api/admin/product/upload-gallery', auth, upload.array('gallery',10), (req,res)=>{
  if (!req.files?.length) return res.status(400).json({error:'No files'});
  const db=readDB(); const urls=req.files.map(f=>`/uploads/${f.filename}`);
  db.product.gallery=[...(db.product.gallery||[]),...urls]; writeDB(db);
  res.json({success:true,urls,gallery:db.product.gallery});
});
app.delete('/api/admin/product/gallery', auth, (req,res)=>{
  const db=readDB(); const {url}=req.body;
  db.product.gallery=(db.product.gallery||[]).filter(u=>u!==url);
  try{ const p=path.join(__dirname,'public',url); if(fs.existsSync(p)) fs.unlinkSync(p); }catch(e){}
  writeDB(db); res.json({success:true,gallery:db.product.gallery});
});

// Features
app.put('/api/admin/features', auth, (req,res)=>{
  const db=readDB(); db.features=req.body; writeDB(db); res.json({success:true});
});

// Versions
app.put('/api/admin/versions', auth, (req,res)=>{
  const db=readDB(); db.versions=req.body; writeDB(db); res.json({success:true});
});
app.post('/api/admin/versions/:id/icon', auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  const idx=db.versions.findIndex(v=>v.id==req.params.id);
  if (idx>-1) { db.versions[idx].icon=url; writeDB(db); }
  res.json({success:true,url});
});

// Content (click-to-edit)
app.put('/api/content', auth, (req,res)=>{
  const {key,value}=req.body;
  if (!key) return res.status(400).json({error:'Key required'});
  const db=readDB(); if(!db.content) db.content={};
  db.content[san(key)]=san(value); writeDB(db); res.json({success:true});
});

// Orders
app.put('/api/admin/orders/:id', auth, (req,res)=>{
  const db=readDB(); const idx=db.orders.findIndex(o=>o.id===req.params.id);
  if(idx===-1) return res.status(404).json({error:'Not found'});
  db.orders[idx]={...db.orders[idx],...req.body}; writeDB(db); res.json({success:true});
});
app.delete('/api/admin/orders/:id', auth, (req,res)=>{
  const db=readDB(); db.orders=db.orders.filter(o=>o.id!==req.params.id); writeDB(db); res.json({success:true});
});

// Reviews
app.put('/api/admin/reviews/:id', auth, (req,res)=>{
  const db=readDB(); const idx=db.reviews.findIndex(r=>r.id==req.params.id);
  if(idx===-1) return res.status(404).json({error:'Not found'});
  db.reviews[idx]={...db.reviews[idx],...req.body}; writeDB(db); res.json({success:true});
});
app.delete('/api/admin/reviews/:id', auth, (req,res)=>{
  const db=readDB(); db.reviews=db.reviews.filter(r=>r.id!=req.params.id); writeDB(db); res.json({success:true});
});

// Settings
app.put('/api/admin/settings', auth, async(req,res)=>{
  const db=readDB();
  if(req.body.new_password){ req.body.admin_password_hash=await bcrypt.hash(req.body.new_password,10); delete req.body.new_password; }
  db.settings={...db.settings,...req.body}; writeDB(db); res.json({success:true});
});

// FAQ
app.post('/api/admin/faq', auth, (req,res)=>{ const db=readDB(); db.faq.push({...req.body,id:Date.now()}); writeDB(db); res.json({success:true}); });
app.put('/api/admin/faq/:id', auth, (req,res)=>{ const db=readDB(); const idx=db.faq.findIndex(f=>f.id==req.params.id); if(idx===-1) return res.status(404).json({error:'Not found'}); db.faq[idx]={...db.faq[idx],...req.body}; writeDB(db); res.json({success:true}); });
app.delete('/api/admin/faq/:id', auth, (req,res)=>{ const db=readDB(); db.faq=db.faq.filter(f=>f.id!=req.params.id); writeDB(db); res.json({success:true}); });

// Routes
app.get('/admin',      (_,res)=>res.sendFile(path.join(__dirname,'admin','index.html')));
app.get('/product',    (_,res)=>res.sendFile(path.join(__dirname,'public','product.html')));
app.get('/{*splat}',   (_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log(`🚀 Team ESP running on port ${PORT}`));
