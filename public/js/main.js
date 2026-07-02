/* ═══════════════════════════════════════════════
   TEAM ESP v4 — main.js
   Features: Dark/Light, Search, Wishlist, Cart,
             Features grid, Versions, Parallax,
             Click-to-edit, 3D animations
═══════════════════════════════════════════════ */

// ─── STATE ───────────────────────────────────────────
let settings    = {};
let productData = null;
let featuresData= [];
let versionsData= [];
let contentMap  = {};
let selectedRating = 0;
let cart      = JSON.parse(localStorage.getItem('teamesp_cart')    || '[]');
let wishlist  = JSON.parse(localStorage.getItem('teamesp_wishlist') || '[]');
let editMode  = false;
let editToken = localStorage.getItem('teamesp_edit_token') || null;
let saveTimer = null;
let appliedCoupon = null;  // {code, discount, type, value}

// ─── THEME ───────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('teamesp_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('teamesp_theme', next);
  updateThemeIcon(next);
  showToast(next === 'light' ? '☀️ Light mode on' : '🌙 Dark mode on');
}
function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ─── LOADER ──────────────────────────────────────────
window.addEventListener('load', () => {
  initTheme();
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('hidden');
    document.body.style.overflow = '';
    initParticles();
    initCounters();
    initReveal();
    initParallax();
    initBackToTop();
  }, 1800);
  document.body.style.overflow = 'hidden';
});

// ─── PARALLAX ────────────────────────────────────────
function initParallax() {
  const heroChar  = document.querySelector('.pubg-char');
  const heroGlow  = document.querySelector('.char-glow');
  const heroBgTxt = document.querySelector('.hero-bg-text');
  const heroLeft  = document.querySelector('.hero-left');
  const ptcls     = document.getElementById('particles');
  const hfcCards  = document.querySelectorAll('.hfc');
  let cx=0, cy=0, mx=0, my=0, ticking=false;

  document.addEventListener('mousemove', e => {
    mx = (e.clientX/window.innerWidth  - 0.5) * 2;
    my = (e.clientY/window.innerHeight - 0.5) * 2;
    if (!ticking) { requestAnimationFrame(doParallax); ticking=true; }
  });

  function doParallax() {
    ticking = false;
    cx += (mx-cx)*0.06; cy += (my-cy)*0.06;
    if (window.scrollY < window.innerHeight) {
      if (heroChar)  heroChar.style.transform  = `translate(${cx*-22}px,${cy*-18}px)`;
      if (heroGlow)  heroGlow.style.transform  = `translate(calc(-50% + ${cx*-30}px),calc(-50% + ${cy*-25}px))`;
      if (heroBgTxt) heroBgTxt.style.transform = `translate(${cx*12}px,${cy*8}px)`;
      if (heroLeft)  heroLeft.style.transform  = `translate(${cx*8}px,${cy*6}px)`;
      if (ptcls)     ptcls.style.transform     = `translate(${cx*15}px,${cy*10}px)`;
      hfcCards.forEach((c,i)=>{ const d=(i+1)*0.4; c.style.transform=`translate(${cx*6*d}px,${cy*4*d}px)`; });
    }
    document.querySelectorAll('.feature-card').forEach((e,i)=>{ const d=[0.8,1.2,0.6,0.9,1.1,0.7][i]||1; e.style.transform=`translate(${cx*3*d}px,${cy*2*d}px)`; });
    document.querySelectorAll('.payment-card').forEach((e,i)=>{ const d=[0.6,1.0,0.8,0.5][i]||0.8; e.style.transform=`translate(${cx*4*d}px,${cy*3*d}px)`; });
    if (!ticking) { requestAnimationFrame(doParallax); ticking=true; }
  }
  window.addEventListener('deviceorientation', e => {
    if (e.gamma===null) return;
    mx = Math.max(-1,Math.min(1,e.gamma/20));
    my = Math.max(-1,Math.min(1,(e.beta-40)/20));
  });
}

// ─── PARTICLES ───────────────────────────────────────
function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  for (let i=0;i<30;i++) {
    const p=document.createElement('div'); p.className='particle';
    const size=Math.random()*4+1, gold=Math.random()>.5;
    p.style.cssText=`left:${Math.random()*100}%;bottom:-10px;width:${size}px;height:${size}px;background:${gold?'#f5a623':'#fff'};opacity:${gold?.6:.2};border-radius:50%;animation-delay:${Math.random()*10}s;animation-duration:${Math.random()*15+10}s;position:absolute;`;
    c.appendChild(p);
  }
}

// ─── BACK TO TOP ─────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
}

// ─── NAVBAR ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  updateActiveNav();
});
function updateActiveNav() {
  const sy = window.scrollY + 100;
  document.querySelectorAll('section[id]').forEach(sec => {
    const link = document.querySelector(`.nav-link[href="#${sec.id}"]`);
    if (link && sy >= sec.offsetTop && sy < sec.offsetTop+sec.offsetHeight) {
      document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}
const hamburger = document.getElementById('hamburger');
const mobileMenu= document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const s=hamburger.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) { s[0].style.transform='rotate(45deg) translate(5px,5px)';s[1].style.opacity='0';s[2].style.transform='rotate(-45deg) translate(5px,-5px)'; }
  else s.forEach(x=>{x.style.transform='';x.style.opacity='';});
});
function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.querySelectorAll('span').forEach(s=>{s.style.transform='';s.style.opacity='';});
}

// ─── SEARCH ──────────────────────────────────────────
let searchOpen = false;
function toggleSearch() {
  searchOpen = !searchOpen;
  const bar = document.getElementById('navSearchBar');
  bar.classList.toggle('open', searchOpen);
  if (searchOpen) setTimeout(()=>document.getElementById('searchInput').focus(), 100);
  else { document.getElementById('searchInput').value=''; document.getElementById('searchResults').innerHTML=''; }
}

function doSearch(query) {
  const results = document.getElementById('searchResults');
  if (!query.trim()) { results.innerHTML=''; return; }
  const q = query.toLowerCase();
  const items = [];

  // Search features
  featuresData.forEach(f => {
    if (f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q))
      items.push({ icon:'fas fa-star', text:f.title, sub:f.desc, href:'#features' });
  });
  // Search versions
  versionsData.forEach(v => {
    if (v.name.toLowerCase().includes(q))
      items.push({ icon:'fas fa-mobile-alt', text:v.name+' Version', sub:v.package, href:'#versions' });
  });
  // Search tiers
  if (productData) {
    productData.tiers.forEach(t => {
      if (t.label.toLowerCase().includes(q)||'subscription'.includes(q))
        items.push({ icon:'fas fa-shopping-cart', text:t.label+' Subscription', sub:`PKR ${Number(t.price_pkr).toLocaleString()} / $${t.price_usdt}`, href:'#subscriptions' });
    });
  }
  // Static pages
  const pages = [{k:'payment',icon:'fas fa-credit-card',text:'Payment Methods',href:'#payment'},{k:'contact',icon:'fas fa-headset',text:'Contact Us',href:'#contact'},{k:'faq',icon:'fas fa-question-circle',text:'FAQ',href:'#faq'}];
  pages.forEach(p=>{ if(p.k.includes(q)||p.text.toLowerCase().includes(q)) items.push({...p,sub:''}); });

  if (!items.length) { results.innerHTML='<div class="search-result-item"><i class="fas fa-search"></i> No results found</div>'; return; }

  results.innerHTML = items.slice(0,6).map(item=>`
    <div class="search-result-item" onclick="smoothTo('${item.href}');toggleSearch()">
      <i class="${item.icon}"></i>
      <div><div>${item.text}</div>${item.sub?`<div style="font-size:11px;opacity:0.6">${item.sub}</div>`:''}</div>
    </div>`).join('');
}

// ─── DATA LOADING ────────────────────────────────────
async function loadData() {
  try {
    const [sR,pR,fR,rR,faqR,cR,vR,aR] = await Promise.all([
      fetch('/api/settings'), fetch('/api/product'), fetch('/api/features'),
      fetch('/api/reviews'),  fetch('/api/faq'),     fetch('/api/content'),
      fetch('/api/versions'), fetch('/api/announcement')
    ]);
    settings     = await sR.json();
    productData  = await pR.json();
    featuresData = await fR.json();
    versionsData = await vR.json();
    const reviews= await rR.json();
    const faq    = await faqR.json();
    contentMap   = await cR.json();
    const announcement = await aR.json();

    applySettings(settings);
    applyLogo(settings);
    applyBackground(settings);
    applyAnnouncement(announcement);
    renderProduct(productData);
    renderFeatures(featuresData);
    renderVersions(versionsData);
    renderReviews(reviews);
    renderFAQ(faq);
    applyContent();
    updateCartUI();
    updateWishlistUI();
    if (editToken) toggleEditMode(true, true);
  } catch(e) { console.error('loadData',e); }
}

function applyBackground(s) {
  if (!s.background_enabled || !s.background_url) {
    document.body.classList.remove('has-bg-image');
    document.body.style.removeProperty('--bg-image');
    document.body.style.removeProperty('--bg-opacity');
    return;
  }
  document.body.style.setProperty('--bg-image', `url('${s.background_url}')`);
  document.body.style.setProperty('--bg-opacity', s.background_opacity || 0.15);
  document.body.classList.add('has-bg-image');
}

function applyAnnouncement(a) {
  const bar = document.getElementById('announcementBar');
  if (!bar) return;
  // Check if user dismissed this exact message before
  const dismissed = localStorage.getItem('teamesp_announce_dismissed');
  if (!a.enabled || !a.message || dismissed === a.message) {
    bar.style.display = 'none';
    document.body.classList.remove('has-announcement');
    return;
  }
  document.getElementById('announcementText').textContent = a.message;
  bar.className = `announcement-bar type-${a.type || 'info'}`;
  bar.style.display = 'block';
  document.body.classList.add('has-announcement');

  const link = document.getElementById('announcementLink');
  if (a.link && a.link_text) {
    link.href = a.link; link.textContent = a.link_text; link.style.display = 'inline-block';
  } else { link.style.display = 'none'; }

  const closeBtn = document.getElementById('announcementClose');
  closeBtn.style.display = a.show_close === false ? 'none' : 'flex';
  // Store current message so we know what was dismissed
  bar.dataset.message = a.message;
}

function closeAnnouncement() {
  const bar = document.getElementById('announcementBar');
  localStorage.setItem('teamesp_announce_dismissed', bar.dataset.message || '');
  bar.style.display = 'none';
  document.body.classList.remove('has-announcement');
}

function applyLogo(s) {
  // ── Navbar logo (with size control) ──
  const logoSize = s.logo_size || 40;
  if (s.logo_url) {
    const ni = document.getElementById('navLogoIcon');
    const nm = document.getElementById('navLogoImg');
    if (ni&&nm) { ni.style.display='none'; nm.src=s.logo_url; nm.style.display='block'; nm.style.height=logoSize+'px'; }
    const fi = document.getElementById('footerLogoIcon');
    const fm = document.getElementById('footerLogoImg');
    if (fi&&fm) { fi.style.display='none'; fm.src=s.logo_url; fm.style.display='block'; }
  } else {
    // No custom logo — still apply size to the default icon box
    const ni = document.getElementById('navLogoIcon');
    if (ni) { ni.style.width=logoSize+'px'; ni.style.height=logoSize+'px'; ni.style.fontSize=(logoSize*0.44)+'px'; }
  }
  // ── Loading screen logo (SEPARATE from navbar) ──
  const loaderLogo = s.loader_logo_url || s.logo_url; // fallback to main logo if not set
  if (loaderLogo) {
    const li = document.getElementById('loaderIcon');
    const lm = document.getElementById('loaderLogo');
    if (li&&lm) { li.style.display='none'; lm.src=loaderLogo; lm.style.display='block'; }
  }
  // ── Favicon ──
  if (s.favicon_url) {
    const fv = document.getElementById('faviconEl');
    if (fv) fv.href = s.favicon_url;
  }
}

function applySettings(s) {
  const lnk = (id,v) => { const el=document.getElementById(id); if(el) el.href=v; };
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  lnk('nav-telegram',  s.telegram  ? `https://t.me/${s.telegram.replace('@','')}` : '#');
  lnk('nav-whatsapp',  s.whatsapp  ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}` : '#');
  set('binance-id',    s.binance_id||'');   set('binance-name',   s.binance_name||'');
  set('easypaisa-num', s.easypaisa||'');    set('easypaisa-name', s.easypaisa_name||'');
  set('jazzcash-num',  s.jazzcash||'');     set('jazzcash-name',  s.jazzcash_name||'');
  lnk('ct-telegram',   s.telegram  ? `https://t.me/${s.telegram.replace('@','')}` : '#');
  lnk('ct-whatsapp',   s.whatsapp  ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}` : '#');
  lnk('ct-instagram',  s.instagram ? `https://instagram.com/${s.instagram}` : '#');
  lnk('ct-discord',    s.discord   ? `https://discord.gg/${s.discord}` : '#');
  set('ct-telegram-text',  s.telegram||'');  set('ct-whatsapp-text',  s.whatsapp||'');
  set('ct-instagram-text', s.instagram||''); set('ct-discord-text',   s.discord||'');
  lnk('ft-telegram',   s.telegram  ? `https://t.me/${s.telegram.replace('@','')}` : '#');
  lnk('ft-whatsapp',   s.whatsapp  ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}` : '#');
  lnk('ft-instagram',  s.instagram ? `https://instagram.com/${s.instagram}` : '#');
  lnk('ft-discord',    s.discord   ? `https://discord.gg/${s.discord}` : '#');
  const sc=document.getElementById('stat-customers');
  if(sc) sc.setAttribute('data-target', parseInt(s.happy_customers||'5000'));
  const sr=document.getElementById('stat-rating');
  if(sr) sr.textContent=(s.rating||'4.9/5').split('/')[0];
}

function applyContent() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key=el.dataset.key;
    if (contentMap[key]!==undefined) el.textContent=contentMap[key];
  });
}

// ─── SINGLE PRODUCT ──────────────────────────────────
function renderProduct(p) {
  const wrap=document.getElementById('productWrap');
  if (!wrap||!p) return;
  const active = p.tiers.find(t=>t.popular)||p.tiers[0];
  window._selectedTierId = active.id;

  wrap.innerHTML=`
    <div class="single-product-card">
      ${p.main_image?`<div class="spc-image" style="grid-column:1/-1"><img src="${p.main_image}" alt="${p.name}"/></div>`:''}
      <div class="spc-left">
        <div class="spc-eyebrow"><i class="fas fa-gamepad"></i> PUBG MOBILE</div>
        <h3 class="spc-name">${p.name}</h3>
        <p class="spc-desc">${p.description}</p>
        <ul class="spc-features">
          <li><i class="fas fa-bolt"></i> Instant delivery (1–5 min)</li>
          <li><i class="fas fa-shield-alt"></i> 100% safe — no password needed</li>
          <li><i class="fas fa-headset"></i> 24/7 customer support</li>
          <li><i class="fas fa-mobile-alt"></i> All PUBG Mobile regions</li>
        </ul>
      </div>
      <div class="spc-right">
        <div class="spc-tier-label">SELECT DURATION</div>
        <div class="spc-tiers" id="spcTiers">
          ${p.tiers.map(t=>`
            <button class="spc-tier ${t.popular?'popular':''} ${t.id===active.id?'active':''}" onclick="selectTier('${t.id}')" data-tier="${t.id}">
              ${t.badge?`<div class="spc-tier-badge">${t.badge}</div>`:''}
              <div class="spc-tier-dur">${t.label}</div>
              <div class="spc-tier-pkr">PKR ${Number(t.price_pkr).toLocaleString()}</div>
              <div class="spc-tier-usdt">$${t.price_usdt}</div>
            </button>`).join('')}
        </div>
        <div class="spc-price-display" id="spcPriceDisplay">
          <div class="spc-price-pkr-big" id="spcPkr">PKR ${Number(active.price_pkr).toLocaleString()}</div>
          <div class="spc-price-usdt-line" id="spcUsdt">$${active.price_usdt} USDT</div>
        </div>
        ${active.description ? `
        <div class="spc-tier-desc" id="spcTierDesc">
          <i class="fas fa-info-circle"></i>
          <span id="spcTierDescText">${active.description}</span>
        </div>` : '<div class="spc-tier-desc" id="spcTierDesc" style="display:none"><i class="fas fa-info-circle"></i><span id="spcTierDescText"></span></div>'}
        <div class="spc-actions">
          <button class="btn-primary btn-3d spc-addcart" onclick="addToCart()"><i class="fas fa-shopping-cart"></i> ADD TO CART</button>
          <button class="btn-glass spc-buynow" onclick="addToCartAndCheckout()"><i class="fas fa-bolt"></i> BUY NOW</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div class="spc-selected-label" id="spcSelectedLabel">Selected: <strong>${active.label}</strong></div>
          <button onclick="addToWishlist()" style="background:transparent;color:var(--text3);font-size:14px;display:flex;align-items:center;gap:5px;font-family:'Exo 2',sans-serif;font-size:12px;" title="Add to Wishlist"><i class="fas fa-heart"></i> Wishlist</button>
        </div>
      </div>
    </div>`;
}

function selectTier(id) {
  if (!productData) return;
  const tier=productData.tiers.find(t=>t.id===id);
  if (!tier) return;
  window._selectedTierId=id;
  document.querySelectorAll('.spc-tier').forEach(b=>b.classList.toggle('active', b.dataset.tier===id));
  document.getElementById('spcPkr').textContent=`PKR ${Number(tier.price_pkr).toLocaleString()}`;
  document.getElementById('spcUsdt').textContent=`$${tier.price_usdt} USDT`;
  document.getElementById('spcSelectedLabel').innerHTML=`Selected: <strong>${tier.label}</strong>`;
  // Update tier description with fade animation
  const descEl = document.getElementById('spcTierDesc');
  const descText = document.getElementById('spcTierDescText');
  if (descEl && descText) {
    if (tier.description) {
      descEl.classList.add('fade');
      setTimeout(()=>{
        descText.textContent = tier.description;
        descEl.style.display = 'flex';
        descEl.classList.remove('fade');
      }, 150);
    } else { descEl.style.display = 'none'; }
  }
  const d=document.getElementById('spcPriceDisplay');
  d.classList.remove('price-pulse'); void d.offsetWidth; d.classList.add('price-pulse');
}

// ─── FEATURES ────────────────────────────────────────
function renderFeatures(features) {
  const grid=document.getElementById('featuresGrid');
  if (!grid) return;
  grid.innerHTML=features.map(f=>`
    <div class="feature-card reveal">
      <div class="fc-icon">${f.icon_url?`<img src="${f.icon_url}" alt="${f.title}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;">`:`<i class="${f.icon}"></i>`}</div>
      <div class="fc-title">${f.title}</div>
      <div class="fc-desc">${f.desc}</div>
    </div>`).join('');
  // Re-init reveal for new elements
  initReveal();
}

// ─── VERSIONS ────────────────────────────────────────
function renderVersions(versions) {
  const grid=document.getElementById('versionsGrid');
  if (!grid) return;
  grid.innerHTML=versions.map(v=>`
    <div class="version-card reveal">
      <div class="vc-icon">${v.icon?`<img src="${v.icon}" alt="${v.name}"/>`:`<i class="fas fa-mobile-alt"></i>`}</div>
      <div class="vc-name">${v.name}</div>
      <div class="vc-package">${v.package}</div>
      ${v.supported?`<div class="vc-supported"><i class="fas fa-check-circle"></i> Supported</div>`:`<div style="color:var(--red);font-size:12px;font-weight:700;">Coming Soon</div>`}
    </div>`).join('');
  initReveal();
}

// ─── REVIEWS ─────────────────────────────────────────
function renderReviews(reviews) {
  const track=document.getElementById('reviewsTrack');
  if (!track||!reviews.length) return;
  const cards=reviews.map(r=>`
    <div class="review-card">
      <div class="rc-header"><div class="rc-avatar">${r.avatar||r.name.slice(0,2).toUpperCase()}</div>
        <div><div class="rc-name">${r.name}</div><div class="rc-meta"><div class="rc-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>${r.verified?'<span class="rc-verified">✓ Verified</span>':''}</div></div>
      </div>
      <p class="rc-comment">${r.comment}</p>
      <div class="rc-date">${new Date(r.date).toLocaleDateString('en-PK',{year:'numeric',month:'short',day:'numeric'})}</div>
    </div>`).join('');
  track.innerHTML=cards+cards;
}

// ─── STAR RATING ─────────────────────────────────────
document.querySelectorAll('.star-rating i').forEach(star=>{
  star.addEventListener('click',()=>{ selectedRating=parseInt(star.dataset.val); updateStars(selectedRating); });
  star.addEventListener('mouseenter',()=>updateStars(parseInt(star.dataset.val)));
});
document.querySelector('.star-rating')?.addEventListener('mouseleave',()=>updateStars(selectedRating));
function updateStars(v){ document.querySelectorAll('.star-rating i').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.val)<=v)); }

async function submitReview() {
  const name=document.getElementById('reviewName').value.trim();
  const comment=document.getElementById('reviewComment').value.trim();
  if (!name||!comment||!selectedRating){ showToast('Fill in all fields!','error'); return; }
  try {
    const res=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,rating:selectedRating,comment})});
    const d=await res.json();
    if(d.success){ document.getElementById('reviewName').value=''; document.getElementById('reviewComment').value=''; selectedRating=0; updateStars(0); showToast('✅ Review submitted for approval!'); }
    else showToast(d.error||'Failed.','error');
  } catch{ showToast('Connection error.','error'); }
}

// ─── FAQ ─────────────────────────────────────────────
function renderFAQ(faq) {
  const list=document.getElementById('faqList');
  if (!list) return;
  list.innerHTML=faq.map(item=>`
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFAQ(this)">${item.question}<i class="fas fa-plus"></i></div>
      <div class="faq-a"><p>${item.answer}</p></div>
    </div>`).join('');
}
function toggleFAQ(el){ const item=el.parentElement,open=item.classList.contains('open'); document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open')); if(!open) item.classList.add('open'); }

// ─── CART ────────────────────────────────────────────
function saveCart(){ localStorage.setItem('teamesp_cart',JSON.stringify(cart)); }

function addToCart(andCheckout=false) {
  if (!productData||!window._selectedTierId) return;
  const tier=productData.tiers.find(t=>t.id===window._selectedTierId);
  if (!tier) return;
  const ex=cart.find(i=>i.tier_id===tier.id);
  if (ex) ex.qty=(ex.qty||1)+1;
  else cart.push({tier_id:tier.id,label:tier.label,price_pkr:tier.price_pkr,price_usdt:tier.price_usdt,qty:1});
  saveCart(); updateCartUI();
  showToast(`✅ ${tier.label} added to cart!`);
  const btn=document.querySelector('.cart-icon-btn');
  btn?.classList.remove('cart-bounce'); void btn?.offsetWidth; btn?.classList.add('cart-bounce');
  if (andCheckout) setTimeout(()=>{ openCart(); openCheckout(); },200);
  else openCart();
}
function addToCartAndCheckout(){ addToCart(true); }
function removeFromCart(id){ cart=cart.filter(i=>i.tier_id!==id); saveCart(); updateCartUI(); renderCartItems(); }
function updateQty(id,d){ const item=cart.find(i=>i.tier_id===id); if(!item) return; item.qty=Math.max(1,(item.qty||1)+d); saveCart(); updateCartUI(); renderCartItems(); }
function clearCart(){ cart=[]; saveCart(); updateCartUI(); renderCartItems(); }
function getCartTotal(){ return { pkr:cart.reduce((s,i)=>s+i.price_pkr*(i.qty||1),0), usdt:cart.reduce((s,i)=>s+i.price_usdt*(i.qty||1),0) }; }

function updateCartUI(){
  const count=cart.reduce((s,i)=>s+(i.qty||1),0);
  const badge=document.getElementById('cartBadge');
  if(badge){ badge.textContent=count; badge.style.display=count?'flex':'none'; }
}

function renderCartItems(){
  const el=document.getElementById('cartItems'), ft=document.getElementById('cartFooter');
  const empty=document.getElementById('cartEmpty');
  if(!cart.length){ if(empty) empty.style.display='flex'; if(ft) ft.style.display='none'; if(el&&empty) el.innerHTML=''; el&&empty&&el.appendChild(empty); return; }
  if(empty) empty.style.display='none'; if(ft) ft.style.display='block';
  const tot=getCartTotal();
  document.getElementById('cartTotalPkr').textContent=`PKR ${Number(tot.pkr).toLocaleString()}`;
  document.getElementById('cartTotalUsdt').textContent=`/ $${tot.usdt.toFixed(2)}`;
  el.innerHTML=cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-info"><div class="cart-item-name">${item.label} Subscription</div><div class="cart-item-price">PKR ${Number(item.price_pkr).toLocaleString()} / $${item.price_usdt}</div></div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="updateQty('${item.tier_id}',-1)"><i class="fas fa-minus"></i></button>
        <span class="cart-qty">${item.qty||1}</span>
        <button class="cart-qty-btn" onclick="updateQty('${item.tier_id}',+1)"><i class="fas fa-plus"></i></button>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.tier_id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function openCart(){ renderCartItems(); document.getElementById('cartDrawer').classList.add('open'); document.getElementById('cartOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); document.body.style.overflow=''; }

// ─── WISHLIST ────────────────────────────────────────
function saveWishlist(){ localStorage.setItem('teamesp_wishlist',JSON.stringify(wishlist)); }

function addToWishlist(){
  if (!productData||!window._selectedTierId) return;
  const tier=productData.tiers.find(t=>t.id===window._selectedTierId);
  if (!tier) return;
  if (wishlist.find(i=>i.tier_id===tier.id)){ showToast('Already in wishlist!'); return; }
  wishlist.push({tier_id:tier.id,label:tier.label,price_pkr:tier.price_pkr,price_usdt:tier.price_usdt});
  saveWishlist(); updateWishlistUI();
  showToast(`❤️ ${tier.label} added to wishlist!`);
}
function removeFromWishlist(id){ wishlist=wishlist.filter(i=>i.tier_id!==id); saveWishlist(); updateWishlistUI(); renderWishlistItems(); }
function updateWishlistUI(){
  const badge=document.getElementById('wishlistBadge');
  if(badge){ badge.textContent=wishlist.length; badge.style.display=wishlist.length?'flex':'none'; }
}
function renderWishlistItems(){
  const el=document.getElementById('wishlistItems'); if(!el) return;
  if(!wishlist.length){ el.innerHTML='<div class="cart-empty"><i class="fas fa-heart"></i><p>Your wishlist is empty</p></div>'; return; }
  el.innerHTML=wishlist.map(item=>`
    <div class="wishlist-item">
      <div><div class="cart-item-name">${item.label} Subscription</div><div class="cart-item-price">PKR ${Number(item.price_pkr).toLocaleString()} / $${item.price_usdt}</div></div>
      <div style="display:flex;gap:8px;">
        <button class="cart-qty-btn" onclick="moveToCart('${item.tier_id}')" title="Add to Cart"><i class="fas fa-cart-plus"></i></button>
        <button class="cart-remove-btn" onclick="removeFromWishlist('${item.tier_id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}
function moveToCart(id){
  const item=wishlist.find(i=>i.tier_id===id); if(!item) return;
  const ex=cart.find(i=>i.tier_id===id);
  if(ex) ex.qty=(ex.qty||1)+1;
  else cart.push({...item,qty:1});
  saveCart(); updateCartUI();
  removeFromWishlist(id);
  showToast('✅ Moved to cart!');
}
function openWishlist(){ renderWishlistItems(); document.getElementById('wishlistDrawer').classList.add('open'); document.getElementById('wishlistOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeWishlist(){ document.getElementById('wishlistDrawer').classList.remove('open'); document.getElementById('wishlistOverlay').classList.remove('open'); document.body.style.overflow=''; }

// ─── CHECKOUT ────────────────────────────────────────
function renderCheckoutSummary() {
  const tot = getCartTotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const final = tot.pkr - discount;
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="checkout-items">
      ${cart.map(i => `<div class="checkout-item"><span>${i.label} × ${i.qty||1}</span><span>PKR ${Number(i.price_pkr*(i.qty||1)).toLocaleString()}</span></div>`).join('')}
      ${appliedCoupon ? `<div class="checkout-discount-row"><span><i class="fas fa-tag"></i> ${appliedCoupon.code}</span><span>− PKR ${Number(discount).toLocaleString()}</span></div>` : ''}
      <div class="checkout-total"><span>Total</span><div><strong>PKR ${Number(final).toLocaleString()}</strong><span> / $${tot.usdt.toFixed(2)} USDT</span></div></div>
    </div>`;
}

async function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim();
  const status = document.getElementById('couponStatus');
  if (!code) { status.textContent=''; return; }
  const tot = getCartTotal();
  try {
    const res = await fetch('/api/coupon/validate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code, total_pkr: tot.pkr })
    });
    const d = await res.json();
    if (d.success) {
      appliedCoupon = d;
      status.className = 'coupon-status success';
      status.innerHTML = `<i class="fas fa-check-circle"></i> <span class="coupon-applied">${d.code}<button onclick="removeCoupon()"><i class="fas fa-times"></i></button></span> ${d.description ? '— '+d.description : ''}`;
      renderCheckoutSummary();
      showToast(`✅ Coupon applied! You saved PKR ${Number(d.discount).toLocaleString()}`);
    } else {
      appliedCoupon = null;
      status.className = 'coupon-status error';
      status.innerHTML = `<i class="fas fa-times-circle"></i> ${d.error || 'Invalid coupon'}`;
      renderCheckoutSummary();
    }
  } catch(e) {
    status.className = 'coupon-status error';
    status.innerHTML = '<i class="fas fa-times-circle"></i> Connection error';
  }
}

function removeCoupon() {
  appliedCoupon = null;
  document.getElementById('couponInput').value = '';
  document.getElementById('couponStatus').textContent = '';
  renderCheckoutSummary();
  showToast('Coupon removed');
}

function openCheckout(){
  if(!cart.length){ showToast('Your cart is empty!','error'); return; }
  appliedCoupon = null;
  document.getElementById('couponInput').value = '';
  document.getElementById('couponStatus').textContent = '';
  renderCheckoutSummary();
  ['orderName','orderContact','orderNotes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('orderPayment').value='';
  closeCart();
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeCheckout(){ document.getElementById('checkoutModal').classList.remove('open'); document.body.style.overflow=''; }

async function submitOrder(){
  const customer_name   =document.getElementById('orderName').value.trim();
  const customer_contact=document.getElementById('orderContact').value.trim();
  const payment_method  =document.getElementById('orderPayment').value;
  const notes           =document.getElementById('orderNotes').value.trim();
  if(!customer_name||!customer_contact||!payment_method){ showToast('Fill all required fields!','error'); return; }
  const btn=document.getElementById('placeOrderBtn');
  const orig=btn.innerHTML; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...'; btn.disabled=true;
  try {
    const body = { items:cart, customer_name, customer_contact, payment_method, notes };
    if (appliedCoupon) body.coupon_code = appliedCoupon.code;
    const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json();
    if(data.success){
      closeCheckout();
      document.getElementById('orderIdDisplay').textContent=data.order_id;
      const tot=getCartTotal();
      const finalTotal = (tot.pkr - (data.discount||0));
      const msg=`Team ESP Order\nOrder ID: ${data.order_id}\n${data.discount?`Discount: PKR ${data.discount}\n`:''}Total: PKR ${Number(finalTotal).toLocaleString()}\nPayment: ${payment_method}`;
      const wn=(settings.whatsapp||'').replace(/[^0-9]/g,'');
      const tn=(settings.telegram||'').replace('@','');
      document.getElementById('successWhatsapp').href=`https://wa.me/${wn}?text=${encodeURIComponent(msg)}`;
      document.getElementById('successTelegram').href=`https://t.me/${tn}`;
      document.getElementById('successModal').classList.add('open');
      document.body.style.overflow='hidden';
      clearCart();
      appliedCoupon = null;
    } else { showToast(data.error||'Order failed.','error'); btn.innerHTML=orig; btn.disabled=false; }
  } catch{ showToast('Connection error.','error'); btn.innerHTML=orig; btn.disabled=false; }
}
function closeSuccessModal(){ document.getElementById('successModal').classList.remove('open'); document.body.style.overflow=''; }

document.querySelectorAll('.modal-overlay').forEach(o=>{ o.addEventListener('click',e=>{ if(e.target===o){ o.classList.remove('open'); document.body.style.overflow=''; } }); });

// ─── CHATBOT ─────────────────────────────────────────
function toggleChat(){ const w=document.getElementById('chatWindow'); w.classList.toggle('open'); if(w.classList.contains('open')) document.getElementById('chatInput').focus(); }
function sendQuick(t){ document.getElementById('chatInput').value=t; sendChatMessage(); }
async function sendChatMessage(){
  const inp=document.getElementById('chatInput'),msg=inp.value.trim(); if(!msg) return;
  inp.value=''; addChatMsg(msg,'user'); const typing=addTyping();
  try { const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})}); const d=await res.json(); typing.remove(); addChatMsg(d.reply,'bot'); }
  catch{ typing.remove(); addChatMsg('Connection error. Contact us directly!','bot'); }
}
function addChatMsg(text,type){ const msgs=document.getElementById('chatMessages'); const div=document.createElement('div'); div.className=`chat-msg ${type}-msg`; div.innerHTML=`${type==='bot'?'<div class="msg-avatar"><i class="fas fa-crosshairs"></i></div>':''}<div class="msg-content">${text}</div>`; msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div; }
function addTyping(){ const msgs=document.getElementById('chatMessages'); const div=document.createElement('div'); div.className='chat-msg bot-msg'; div.innerHTML='<div class="msg-avatar"><i class="fas fa-crosshairs"></i></div><div class="msg-content"><div class="chat-typing"><span></span><span></span><span></span></div></div>'; msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div; }

// ─── HELPERS ─────────────────────────────────────────
function copyText(id){ const el=document.getElementById(id); if(!el) return; navigator.clipboard.writeText(el.textContent).then(()=>showToast('📋 Copied!')).catch(()=>{ const r=document.createRange(); r.selectNode(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); document.execCommand('copy'); window.getSelection().removeAllRanges(); showToast('📋 Copied!'); }); }
function showToast(msg,type='success'){ const t=document.getElementById('toast'); t.textContent=msg; t.className=`toast show ${type}`; clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('show'),3500); }
function smoothTo(sel){ const el=document.querySelector(sel); if(el) window.scrollTo({top:el.offsetTop-80,behavior:'smooth'}); }
function initCounters(){ document.querySelectorAll('.counter-anim,.counter').forEach(el=>{ const tgt=parseInt(el.dataset.target||el.getAttribute('data-target')||'0'); if(!tgt) return; let cur=0; const step=tgt/(2000/16); const t=setInterval(()=>{ cur=Math.min(cur+step,tgt); el.textContent=Math.floor(cur).toLocaleString(); if(cur>=tgt) clearInterval(t); },16); }); }
function initReveal(){ const obs=new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } }); },{threshold:.1,rootMargin:'0px 0px -50px 0px'}); document.querySelectorAll('.reveal').forEach(el=>obs.observe(el)); }

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link=>{ link.addEventListener('click',e=>{ const t=document.querySelector(link.getAttribute('href')); if(t){ e.preventDefault(); window.scrollTo({top:t.offsetTop-80,behavior:'smooth'}); } }); });

// ─── CLICK-TO-EDIT ───────────────────────────────────
function showEditLogin(){ document.getElementById('editLoginModal').classList.add('open'); document.body.style.overflow='hidden'; setTimeout(()=>document.getElementById('editAdminPw').focus(),100); }
function hideEditLogin(){ document.getElementById('editLoginModal').classList.remove('open'); document.body.style.overflow=''; }

async function doEditLogin(){
  const pw=document.getElementById('editAdminPw').value; if(!pw) return;
  try {
    const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const d=await res.json();
    if(d.token){ editToken=d.token; localStorage.setItem('teamesp_edit_token',editToken); hideEditLogin(); document.getElementById('editAdminPw').value=''; document.getElementById('editLoginErr').style.display='none'; toggleEditMode(true); }
    else document.getElementById('editLoginErr').style.display='block';
  } catch{ document.getElementById('editLoginErr').style.display='block'; }
}

function toggleEditMode(on, silent=false){
  editMode=on;
  document.getElementById('editToolbar').style.display=on?'block':'none';
  document.getElementById('editLoginBtn').style.display=on?'none':'flex';
  document.body.classList.toggle('edit-mode-active',on);
  if(on){ document.querySelectorAll('[data-key]').forEach(el=>makeEditable(el)); if(!silent) showToast('✏️ Edit Mode ON — Click any highlighted text!'); }
  else { document.querySelectorAll('[data-key]').forEach(el=>removeEditable(el)); editToken=null; localStorage.removeItem('teamesp_edit_token'); showToast('Edit mode off.'); }
}

function makeEditable(el){
  el.classList.add('editable-active'); el.setAttribute('contenteditable','true'); el.setAttribute('spellcheck','false');
  el._onInput=()=>{ clearTimeout(saveTimer); showSaveStatus('Saving...'); saveTimer=setTimeout(()=>saveContent(el.dataset.key,el.textContent.trim()),800); };
  el._onKeydown=e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); el.blur(); } if(e.key==='Escape') el.blur(); };
  el._onFocus=()=>el.classList.add('editing');
  el._onBlur=()=>{ el.classList.remove('editing'); saveContent(el.dataset.key,el.textContent.trim()); };
  el.addEventListener('input',el._onInput); el.addEventListener('keydown',el._onKeydown);
  el.addEventListener('focus',el._onFocus);  el.addEventListener('blur',el._onBlur);
}
function removeEditable(el){
  el.classList.remove('editable-active','editing'); el.removeAttribute('contenteditable');
  el.removeEventListener('input',el._onInput); el.removeEventListener('keydown',el._onKeydown);
  el.removeEventListener('focus',el._onFocus);  el.removeEventListener('blur',el._onBlur);
}
async function saveContent(key,value){
  if(!editToken) return;
  try {
    const res=await fetch('/api/content',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':`Bearer ${editToken}`},body:JSON.stringify({key,value})});
    const d=await res.json();
    if(d.success){ contentMap[key]=value; showSaveStatus('✅ Saved!'); setTimeout(()=>showSaveStatus(''),2000); }
    else if(res.status===401||res.status===403){ toggleEditMode(false); showToast('Session expired. Login again.','error'); }
  } catch{ showSaveStatus('❌ Error'); }
}
function showSaveStatus(msg){ const el=document.getElementById('editSaveStatus'); if(el) el.textContent=msg; }

// ─── INIT ────────────────────────────────────────────
loadData();
