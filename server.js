const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const multer    = require('multer');
const rateLimit = require('express-rate-limit');
const { readDB, writeDB } = require('./db/database');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'teamesp_super_secret_2024';

// Security headers
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('X-XSS-Protection','1; mode=block');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  next();
});

// Multer
const uploadsDir = path.join(__dirname,'public','uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir,{recursive:true});
const storage = multer.diskStorage({
  destination: (_,__,cb) => cb(null,uploadsDir),
  filename:    (_,file,cb) => cb(null,`${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10*1024*1024 },
  fileFilter: (_,file,cb) => {
    const ok = /jpeg|jpg|png|gif|webp|svg|ico|mp4|mov|webm/.test(path.extname(file.originalname).toLowerCase());
    cb(null,ok);
  }
});

app.use(cors());
app.use(express.json({ limit:'2mb' }));
app.use(express.urlencoded({ extended:true, limit:'2mb' }));

// Maintenance mode middleware (runs BEFORE static files)
app.use((req,res,next)=>{
  const db = readDB();
  if (!db.maintenance?.enabled) return next();
  // Allow admin routes, login, and API admin endpoints
  if (req.path.startsWith('/admin') ||
      req.path.startsWith('/api/admin') ||
      req.path.startsWith('/api/settings') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/css') ||
      req.path.startsWith('/js') ||
      req.path === '/favicon.ico' ||
      req.path === '/maintenance') return next();
  // Show maintenance page for everything else
  if (req.path === '/' || req.path === '/index.html' || !req.path.includes('.')) {
    return res.sendFile(path.join(__dirname,'public','maintenance.html'));
  }
  next();
});

app.use(express.static(path.join(__dirname,'public')));

// Rate limiting
const limiter      = rateLimit({ windowMs:15*60*1000, max:300, standardHeaders:true });
const loginLimiter = rateLimit({ windowMs:15*60*1000, max:10,  message:'Too many login attempts' });
app.use('/api/', limiter);

function auth(req,res,next){
  const t = req.headers['authorization']?.split(' ')[1];
  if (!t) return res.status(401).json({error:'Access denied'});
  try { req.admin = jwt.verify(t,JWT_SECRET); next(); }
  catch { res.status(403).json({error:'Invalid token'}); }
}
function san(str){ return String(str||'').replace(/[<>]/g,'').trim().slice(0,2000); }

// ═══ PUBLIC ═══
app.get('/api/product',      (_,res)=>{ const db=readDB(); res.json(db.product); });
app.get('/api/features',     (_,res)=>{ const db=readDB(); res.json(db.features.filter(f=>f.active)); });
app.get('/api/versions',     (_,res)=>{ const db=readDB(); res.json(db.versions); });
app.get('/api/reviews',      (_,res)=>{ const db=readDB(); res.json(db.reviews.filter(r=>!r.pending)); });
app.get('/api/faq',          (_,res)=>{ const db=readDB(); res.json(db.faq); });
app.get('/api/content',      (_,res)=>{ const db=readDB(); res.json(db.content||{}); });
app.get('/api/announcement', (_,res)=>{ const db=readDB(); res.json(db.announcement||{enabled:false}); });
app.get('/api/maintenance',  (_,res)=>{ const db=readDB(); res.json(db.maintenance||{enabled:false}); });

app.get('/api/settings', (_,res)=>{
  const db=readDB();
  const { admin_password_hash,...pub } = db.settings;
  res.json(pub);
});

// Validate coupon
app.post('/api/coupon/validate', (req,res)=>{
  const { code, total_pkr } = req.body;
  if (!code) return res.status(400).json({error:'Code required'});
  const db = readDB();
  const c = db.coupons.find(x => x.code.toUpperCase() === code.toUpperCase().trim() && x.active);
  if (!c)               return res.status(404).json({error:'Invalid coupon code'});
  if (c.used >= c.usage_limit) return res.status(400).json({error:'Coupon usage limit reached'});
  if (c.expiry && new Date(c.expiry) < new Date()) return res.status(400).json({error:'Coupon has expired'});
  if (c.min_order && total_pkr < c.min_order)      return res.status(400).json({error:`Minimum order PKR ${c.min_order} required`});
  let discount = c.type === 'percent' ? Math.round(total_pkr * c.value / 100) : c.value;
  if (discount > total_pkr) discount = total_pkr;
  res.json({
    success:true,
    code: c.code,
    type: c.type,
    value: c.value,
    discount: discount,
    description: c.description
  });
});

app.post('/api/orders', (req,res)=>{
  const { items, customer_name, customer_contact, payment_method, pubg_id, notes, coupon_code } = req.body;
  if (!items?.length||!customer_name||!customer_contact||!payment_method)
    return res.status(400).json({error:'All fields required'});
  const db=readDB();
  let total_pkr  = items.reduce((s,i)=>s+i.price_pkr*(i.qty||1),0);
  let total_usdt = items.reduce((s,i)=>s+i.price_usdt*(i.qty||1),0);
  let discount = 0;
  let applied_coupon = null;

  if (coupon_code) {
    const c = db.coupons.find(x => x.code.toUpperCase() === coupon_code.toUpperCase().trim() && x.active);
    if (c && c.used < c.usage_limit && (!c.expiry || new Date(c.expiry) > new Date()) && total_pkr >= (c.min_order||0)) {
      discount = c.type === 'percent' ? Math.round(total_pkr * c.value / 100) : c.value;
      if (discount > total_pkr) discount = total_pkr;
      c.used += 1;
      applied_coupon = c.code;
    }
  }

  const order = {
    id:`ESP-${Date.now()}`,
    items: items.map(i=>({...i,label:san(i.label)})),
    subtotal_pkr: total_pkr,
    discount: discount,
    coupon: applied_coupon,
    total_pkr:  total_pkr - discount,
    total_usdt: total_usdt,
    customer_name:    san(customer_name),
    customer_contact: san(customer_contact),
    payment_method:   san(payment_method),
    pubg_id:          san(pubg_id||''),
    notes:            san(notes||''),
    status:'pending',
    created_at: new Date().toISOString()
  };
  db.orders.push(order);
  writeDB(db);
  res.json({ success:true, order_id:order.id, discount, total: order.total_pkr });
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
  else if (msg.includes('coupon')||msg.includes('discount')||msg.includes('code'))
    reply=`🎟️ Try our active coupon codes:<br>${db.coupons.filter(c=>c.active).map(c=>`• <b>${c.code}</b>: ${c.description}`).join('<br>')}`;
  else if (msg.includes('payment')||msg.includes('pay'))
    reply=`💳 Binance: ${s.binance_id} | EasyPaisa: ${s.easypaisa} | JazzCash: ${s.jazzcash}`;
  else if (msg.includes('delivery')||msg.includes('fast'))
    reply=`⚡ Delivery in <b>${s.delivery_time}</b> after payment. We run 24/7!`;
  else if (msg.includes('safe')||msg.includes('scam'))
    reply=`🛡️ <b>100% Safe!</b> ${s.happy_customers} happy customers. We NEVER ask for your password!`;
  else if (msg.includes('contact')||msg.includes('support'))
    reply=`📞 Telegram: ${s.telegram} | WhatsApp: ${s.whatsapp}`;
  else if (msg.includes('hello')||msg.includes('hi')||msg.includes('salaam'))
    reply=`👋 <b>Welcome to Team ESP!</b> Ask me about <b>prices</b>, <b>payment</b>, <b>delivery</b>, or <b>discount codes</b>!`;
  else
    reply=`🤖 Try: <b>prices</b>, <b>payment</b>, <b>delivery</b>, <b>coupon codes</b>, <b>contact</b>`;
  db.chat_messages=db.chat_messages||[];
  db.chat_messages.push({message:san(message),reply,timestamp:new Date().toISOString()});
  if (db.chat_messages.length>500) db.chat_messages=db.chat_messages.slice(-300);
  writeDB(db); res.json({reply});
});

// ═══ ADMIN ═══
app.post('/api/admin/login', loginLimiter, async(req,res)=>{
  const { password } = req.body;
  if (!password) return res.status(400).json({error:'Password required'});
  const db = readDB();
  const valid = await bcrypt.compare(password, db.settings.admin_password_hash);
  if (!valid) return res.status(401).json({error:'Invalid password'});
  const token = jwt.sign({admin:true}, JWT_SECRET, {expiresIn:'24h'});
  res.json({token});
});

app.get('/api/admin/dashboard', auth, (req,res)=>{
  const db = readDB();
  res.json({
    product:db.product, reviews:db.reviews, orders:db.orders, settings:db.settings,
    faq:db.faq, content:db.content, features:db.features, versions:db.versions,
    coupons:db.coupons, announcement:db.announcement, maintenance:db.maintenance,
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

// Tier description update (for product tiers individually)
app.put('/api/admin/product/tier/:tierId', auth, (req,res)=>{
  const db = readDB();
  const idx = db.product.tiers.findIndex(t => t.id === req.params.tierId);
  if (idx === -1) return res.status(404).json({error:'Tier not found'});
  db.product.tiers[idx] = { ...db.product.tiers[idx], ...req.body };
  writeDB(db);
  res.json({success:true, tier: db.product.tiers[idx]});
});

// Logo / Favicon / Background upload
app.post('/api/admin/upload/logo',       auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  db.settings.logo_url=url; writeDB(db); res.json({success:true,url});
});
app.post('/api/admin/upload/favicon',    auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  db.settings.favicon_url=url; writeDB(db); res.json({success:true,url});
});
app.post('/api/admin/upload/background', auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  const db=readDB(); const url=`/uploads/${req.file.filename}`;
  db.settings.background_url=url; writeDB(db); res.json({success:true,url});
});
app.post('/api/admin/upload/icon', auth, upload.single('file'), (req,res)=>{
  if (!req.file) return res.status(400).json({error:'No file'});
  res.json({success:true, url:`/uploads/${req.file.filename}`});
});

// Product images
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

// Features, Versions
app.put('/api/admin/features', auth, (req,res)=>{ const db=readDB(); db.features=req.body; writeDB(db); res.json({success:true}); });
app.put('/api/admin/versions', auth, (req,res)=>{ const db=readDB(); db.versions=req.body; writeDB(db); res.json({success:true}); });

// COUPONS
app.get('/api/admin/coupons', auth, (_,res)=>{ const db=readDB(); res.json(db.coupons||[]); });
app.post('/api/admin/coupons', auth, (req,res)=>{
  const db=readDB();
  const coupon = {
    id: Date.now(),
    code: san(req.body.code).toUpperCase(),
    type: req.body.type === 'percent' ? 'percent' : 'fixed',
    value: parseFloat(req.body.value) || 0,
    min_order: parseFloat(req.body.min_order) || 0,
    expiry: req.body.expiry || '',
    usage_limit: parseInt(req.body.usage_limit) || 100,
    used: 0,
    active: req.body.active !== false,
    description: san(req.body.description||'')
  };
  db.coupons.push(coupon); writeDB(db);
  res.json({success:true, coupon});
});
app.put('/api/admin/coupons/:id', auth, (req,res)=>{
  const db=readDB();
  const idx = db.coupons.findIndex(c => c.id == req.params.id);
  if (idx === -1) return res.status(404).json({error:'Not found'});
  db.coupons[idx] = { ...db.coupons[idx], ...req.body };
  if (req.body.code) db.coupons[idx].code = san(req.body.code).toUpperCase();
  writeDB(db);
  res.json({success:true});
});
app.delete('/api/admin/coupons/:id', auth, (req,res)=>{
  const db=readDB();
  db.coupons = db.coupons.filter(c => c.id != req.params.id);
  writeDB(db); res.json({success:true});
});

// ANNOUNCEMENT
app.put('/api/admin/announcement', auth, (req,res)=>{
  const db = readDB();
  db.announcement = { ...db.announcement, ...req.body };
  writeDB(db);
  res.json({success:true, announcement: db.announcement});
});

// MAINTENANCE
app.put('/api/admin/maintenance', auth, (req,res)=>{
  const db = readDB();
  db.maintenance = { ...db.maintenance, ...req.body };
  writeDB(db);
  res.json({success:true, maintenance: db.maintenance});
});

// Content
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
app.get('/maintenance',(_,res)=>res.sendFile(path.join(__dirname,'public','maintenance.html')));
app.get('/{*splat}',   (_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log(`🚀 Team ESP running on port ${PORT}`));
