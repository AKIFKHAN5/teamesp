/* ═══════════════════════════════════════════════
   TEAM ESP — MAIN JS  v3
   Features: Single product+tiers, Cart, Click-to-edit, Parallax
═══════════════════════════════════════════════ */

// ─── STATE ───────────────────────────────────────────
let selectedRating = 0;
let settings = {};
let productData = null;
let cart = JSON.parse(localStorage.getItem('teamesp_cart') || '[]');
let editMode = false;
let editToken = localStorage.getItem('teamesp_edit_token') || null;
let contentMap = {};   // key → saved text from DB
let saveTimer = null;

// ─── LOADER ──────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('hidden');
    document.body.style.overflow = '';
    initParticles();
    initCounters();
    initReveal();
    initParallax();
  }, 1800);
  document.body.style.overflow = 'hidden';
});

// ─── PARALLAX ────────────────────────────────────────
function initParallax() {
  const heroChar  = document.querySelector('.pubg-char');
  const heroGlow  = document.querySelector('.char-glow');
  const heroBgTxt = document.querySelector('.hero-bg-text');
  const heroLeft  = document.querySelector('.hero-left');
  const particles = document.getElementById('particles');
  const hfcCards  = document.querySelectorAll('.hfc');
  let cx=0,cy=0,mx=0,my=0,ticking=false;

  document.addEventListener('mousemove', e => {
    mx = (e.clientX/window.innerWidth  - 0.5)*2;
    my = (e.clientY/window.innerHeight - 0.5)*2;
    if (!ticking) { requestAnimationFrame(doParallax); ticking=true; }
  });

  function doParallax() {
    ticking=false;
    cx += (mx-cx)*0.06; cy += (my-cy)*0.06;
    if (window.scrollY < window.innerHeight) {
      if (heroChar)  heroChar.style.transform  = `translate(${cx*-22}px,${cy*-18}px)`;
      if (heroGlow)  heroGlow.style.transform  = `translate(calc(-50% + ${cx*-30}px),calc(-50% + ${cy*-25}px))`;
      if (heroBgTxt) heroBgTxt.style.transform = `translate(${cx*12}px,${cy*8}px)`;
      if (heroLeft)  heroLeft.style.transform  = `translate(${cx*8}px,${cy*6}px)`;
      if (particles) particles.style.transform = `translate(${cx*15}px,${cy*10}px)`;
      hfcCards.forEach((c,i)=>{ const d=(i+1)*0.4; c.style.transform=`translate(${cx*6*d}px,${cy*4*d}px)`; });
    }
    document.querySelectorAll('.about-card').forEach((e,i)=>{ const d=[0.8,1.2,0.6][i%3]||1; e.style.transform=`translate(${cx*4*d}px,${cy*3*d}px)`; });
    document.querySelectorAll('.step-icon').forEach((e,i)=>{ e.style.transform=`translate(${cx*(3+i*0.5)}px,${cy*(2+i*0.4)}px)`; });
    document.querySelectorAll('.payment-card').forEach((e,i)=>{ const d=[0.6,1.0,0.8][i]||0.8; e.style.transform=`translate(${cx*5*d}px,${cy*4*d}px)`; });
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
    p.style.cssText=`left:${Math.random()*100}%;bottom:-10px;width:${size}px;height:${size}px;background:${gold?'#f5a623':'#fff'};opacity:${gold?.6:.2};animation-delay:${Math.random()*10}s;animation-duration:${Math.random()*15+10}s;`;
    c.appendChild(p);
  }
}

// ─── NAVBAR ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY>50);
  updateActiveNav();
});
function updateActiveNav() {
  const sy = window.scrollY+100;
  document.querySelectorAll('section[id]').forEach(sec => {
    const link = document.querySelector(`.nav-link[href="#${sec.id}"]`);
    if (link && sy>=sec.offsetTop && sy<sec.offsetTop+sec.offsetHeight) {
      document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}
const hamburger=document.getElementById('hamburger'), mobileMenu=document.getElementById('mobileMenu');
hamburger.addEventListener('click',()=>{
  mobileMenu.classList.toggle('open');
  const s=hamburger.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) { s[0].style.transform='rotate(45deg) translate(5px,5px)';s[1].style.opacity='0';s[2].style.transform='rotate(-45deg) translate(5px,-5px)'; }
  else s.forEach(x=>{x.style.transform='';x.style.opacity='';});
});
function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.querySelectorAll('span').forEach(s=>{s.style.transform='';s.style.opacity='';});
}

// ─── DATA LOADING ────────────────────────────────────
async function loadData() {
  try {
    const [sRes,pRes,rRes,fRes,cRes] = await Promise.all([
      fetch('/api/settings'), fetch('/api/product'),
      fetch('/api/reviews'),  fetch('/api/faq'), fetch('/api/content')
    ]);
    settings   = await sRes.json();
    productData= await pRes.json();
    const reviews = await rRes.json();
    const faq     = await fRes.json();
    contentMap    = await cRes.json();
    applySettings(settings);
    renderProduct(productData);
    renderReviews(reviews);
    renderFAQ(faq);
    applyContent();
    updateCartUI();
    // Restore edit mode if token still valid
    if (editToken) toggleEditMode(true, true);
  } catch(e) { console.error('loadData',e); }
}

function applySettings(s) {
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  const lnk = (id,v) => { const el=document.getElementById(id); if(el) el.href=v; };
  const t = id => { const el=document.getElementById(id); if(el) el.textContent=s[id.replace('-','_')]||''; };

  document.getElementById('hero-tagline') && (document.getElementById('hero-tagline').textContent = contentMap['hero-tagline'] || s.tagline || '');

  lnk('nav-telegram', s.telegram?`https://t.me/${s.telegram.replace('@','')}`:'#');
  lnk('nav-whatsapp', s.whatsapp?`https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}`:'#');
  lnk('nav-instagram',s.instagram?`https://instagram.com/${s.instagram}`:'#');
  lnk('nav-discord',  s.discord?`https://discord.gg/${s.discord}`:'#');

  set('binance-id',   s.binance_id||'');  set('binance-name',   s.binance_name||'');
  set('easypaisa-num',s.easypaisa||'');   set('easypaisa-name', s.easypaisa_name||'');
  set('jazzcash-num', s.jazzcash||'');    set('jazzcash-name',  s.jazzcash_name||'');

  lnk('ct-telegram',  s.telegram?`https://t.me/${s.telegram.replace('@','')}`:'#');
  lnk('ct-whatsapp',  s.whatsapp?`https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}`:'#');
  lnk('ct-instagram', s.instagram?`https://instagram.com/${s.instagram}`:'#');
  lnk('ct-discord',   s.discord?`https://discord.gg/${s.discord}`:'#');
  set('ct-telegram-text',s.telegram||''); set('ct-whatsapp-text',s.whatsapp||'');
  set('ct-instagram-text',s.instagram||''); set('ct-discord-text',s.discord||'');

  lnk('ft-telegram',  s.telegram?`https://t.me/${s.telegram.replace('@','')}`:'#');
  lnk('ft-whatsapp',  s.whatsapp?`https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}`:'#');
  lnk('ft-instagram', s.instagram?`https://instagram.com/${s.instagram}`:'#');
  lnk('ft-discord',   s.discord?`https://discord.gg/${s.discord}`:'#');

  const sc=document.getElementById('stat-customers');
  if(sc) sc.setAttribute('data-target', parseInt(s.happy_customers||'5000'));
  const sr=document.getElementById('stat-rating');
  if(sr) sr.textContent=(s.rating||'4.9/5').split('/')[0];
}

// ─── SINGLE PRODUCT WITH TIER SELECTOR ───────────────
function renderProduct(p) {
  const wrap = document.getElementById('productWrap');
  if (!wrap || !p) return;
  const activeTier = p.tiers.find(t=>t.popular) || p.tiers[0];

  wrap.innerHTML = `
    <div class="single-product-card">
      ${p.main_image ? `<div class="spc-image"><img src="${p.main_image}" alt="${p.name}"/></div>` : ''}
      <div class="spc-left">
        <div class="spc-eyebrow"><i class="fas fa-gamepad"></i> PUBG MOBILE</div>
        <h3 class="spc-name">${p.name}</h3>
        <p class="spc-desc">${p.description}</p>
        <ul class="spc-features">
          <li><i class="fas fa-bolt"></i> Instant delivery (1–5 min)</li>
          <li><i class="fas fa-shield-alt"></i> 100% safe — no password needed</li>
          <li><i class="fas fa-headset"></i> 24/7 customer support</li>
          <li><i class="fas fa-mobile-alt"></i> PUBG Mobile all regions</li>
        </ul>
      </div>
      <div class="spc-right">
        <div class="spc-tier-label">SELECT DURATION</div>
        <div class="spc-tiers" id="spcTiers">
          ${p.tiers.map(t => `
            <button class="spc-tier ${t.popular?'popular':''} ${t.id===activeTier.id?'active':''}"
                    onclick="selectTier('${t.id}')" data-tier="${t.id}">
              ${t.badge?`<div class="spc-tier-badge">${t.badge}</div>`:''}
              <div class="spc-tier-dur">${t.label}</div>
              <div class="spc-tier-pkr">PKR ${Number(t.price_pkr).toLocaleString()}</div>
              <div class="spc-tier-usdt">$${t.price_usdt} USDT</div>
            </button>
          `).join('')}
        </div>
        <div class="spc-price-display" id="spcPriceDisplay">
          <div class="spc-price-main"><span class="spc-price-pkr-big" id="spcPkr">PKR ${Number(activeTier.price_pkr).toLocaleString()}</span></div>
          <div class="spc-price-usdt-line" id="spcUsdt">$${activeTier.price_usdt} USDT</div>
        </div>
        <div class="spc-actions">
          <button class="btn-primary spc-addcart" id="spcAddCart" onclick="addToCart()">
            <i class="fas fa-shopping-cart"></i> ADD TO CART
          </button>
          <button class="btn-outline spc-buynow" onclick="addToCartAndCheckout()">
            <i class="fas fa-bolt"></i> BUY NOW
          </button>
        </div>
        <div class="spc-selected-label" id="spcSelectedLabel">
          Selected: <strong>${activeTier.label}</strong>
        </div>
      </div>
    </div>
  `;
  window._selectedTierId = activeTier.id;
}

function selectTier(id) {
  if (!productData) return;
  const tier = productData.tiers.find(t=>t.id===id);
  if (!tier) return;
  window._selectedTierId = id;
  document.querySelectorAll('.spc-tier').forEach(b=>b.classList.toggle('active', b.dataset.tier===id));
  document.getElementById('spcPkr').textContent   = `PKR ${Number(tier.price_pkr).toLocaleString()}`;
  document.getElementById('spcUsdt').textContent  = `$${tier.price_usdt} USDT`;
  document.getElementById('spcSelectedLabel').innerHTML = `Selected: <strong>${tier.label}</strong>`;
  // Pulse animation
  const disp = document.getElementById('spcPriceDisplay');
  disp.classList.remove('price-pulse'); void disp.offsetWidth; disp.classList.add('price-pulse');
}

// ─── CART ────────────────────────────────────────────
function saveCart() { localStorage.setItem('teamesp_cart', JSON.stringify(cart)); }

function addToCart(andCheckout=false) {
  if (!productData || !window._selectedTierId) return;
  const tier = productData.tiers.find(t=>t.id===window._selectedTierId);
  if (!tier) return;
  const existing = cart.find(i=>i.tier_id===tier.id);
  if (existing) { existing.qty = (existing.qty||1)+1; }
  else { cart.push({ tier_id:tier.id, label:tier.label, price_pkr:tier.price_pkr, price_usdt:tier.price_usdt, qty:1 }); }
  saveCart();
  updateCartUI();
  showToast(`✅ ${tier.label} added to cart!`);
  // Bounce cart icon
  const btn=document.querySelector('.cart-nav-btn');
  btn?.classList.remove('cart-bounce'); void btn?.offsetWidth; btn?.classList.add('cart-bounce');
  if (andCheckout) { setTimeout(()=>{ openCart(); openCheckout(); }, 200); }
  else openCart();
}
function addToCartAndCheckout() { addToCart(true); }

function removeFromCart(tierId) {
  cart = cart.filter(i=>i.tier_id!==tierId);
  saveCart(); updateCartUI(); renderCartItems();
}
function updateQty(tierId, delta) {
  const item = cart.find(i=>i.tier_id===tierId);
  if (!item) return;
  item.qty = Math.max(1, (item.qty||1)+delta);
  saveCart(); updateCartUI(); renderCartItems();
}
function clearCart() { cart=[]; saveCart(); updateCartUI(); renderCartItems(); }

function getCartTotal() {
  return {
    pkr:  cart.reduce((s,i)=>s+i.price_pkr*(i.qty||1),0),
    usdt: cart.reduce((s,i)=>s+i.price_usdt*(i.qty||1),0)
  };
}

function updateCartUI() {
  const count = cart.reduce((s,i)=>s+(i.qty||1),0);
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.textContent=count; badge.style.display=count?'flex':'none'; }
}

function renderCartItems() {
  const el  = document.getElementById('cartItems');
  const ft  = document.getElementById('cartFooter');
  const empty=document.getElementById('cartEmpty');
  if (!cart.length) {
    if (empty) empty.style.display='flex';
    if (ft) ft.style.display='none';
    if (el) el.innerHTML=''; el && el.appendChild(document.getElementById('cartEmpty'));
    return;
  }
  if (empty) empty.style.display='none';
  if (ft) ft.style.display='block';
  const tot = getCartTotal();
  document.getElementById('cartTotalPkr').textContent  = `PKR ${Number(tot.pkr).toLocaleString()}`;
  document.getElementById('cartTotalUsdt').textContent = `/ $${tot.usdt.toFixed(2)} USDT`;
  el.innerHTML = cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.label} Subscription</div>
        <div class="cart-item-price">PKR ${Number(item.price_pkr).toLocaleString()} / $${item.price_usdt} USDT</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="updateQty('${item.tier_id}',-1)"><i class="fas fa-minus"></i></button>
        <span class="cart-qty">${item.qty||1}</span>
        <button class="cart-qty-btn" onclick="updateQty('${item.tier_id}',+1)"><i class="fas fa-plus"></i></button>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.tier_id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function openCart() {
  renderCartItems();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow='';
}
function smoothTo(sel) { const el=document.querySelector(sel); if(el) window.scrollTo({top:el.offsetTop-80,behavior:'smooth'}); }

// ─── CHECKOUT ────────────────────────────────────────
function openCheckout() {
  if (!cart.length) { showToast('Your cart is empty!','error'); return; }
  const tot = getCartTotal();
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="checkout-items">
      ${cart.map(i=>`
        <div class="checkout-item">
          <span>${i.label} Subscription × ${i.qty||1}</span>
          <span>PKR ${Number(i.price_pkr*(i.qty||1)).toLocaleString()}</span>
        </div>
      `).join('')}
      <div class="checkout-total">
        <span>Total</span>
        <div><strong>PKR ${Number(tot.pkr).toLocaleString()}</strong><span> / $${tot.usdt.toFixed(2)} USDT</span></div>
      </div>
    </div>
  `;
  ['orderName','orderContact','orderPubgId','orderNotes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('orderPayment').value='';
  closeCart();
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow='';
}

async function submitOrder() {
  const customer_name   =document.getElementById('orderName').value.trim();
  const customer_contact=document.getElementById('orderContact').value.trim();
  const pubg_id         =document.getElementById('orderPubgId').value.trim();
  const payment_method  =document.getElementById('orderPayment').value;
  const notes           =document.getElementById('orderNotes').value.trim();
  if (!customer_name||!customer_contact||!pubg_id||!payment_method) {
    showToast('Please fill all required fields!','error'); return;
  }
  const btn=document.getElementById('placeOrderBtn');
  const orig=btn.innerHTML; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...'; btn.disabled=true;
  try {
    const res = await fetch('/api/orders',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ items:cart, customer_name, customer_contact, pubg_id, payment_method, notes })
    });
    const data = await res.json();
    if (data.success) {
      closeCheckout();
      document.getElementById('orderIdDisplay').textContent=data.order_id;
      const tot=getCartTotal();
      const msg=`Team ESP Order\nOrder ID: ${data.order_id}\nPUBG ID: ${pubg_id}\nTotal: PKR ${Number(tot.pkr).toLocaleString()}\nPayment: ${payment_method}`;
      const wn=(settings.whatsapp||'').replace(/[^0-9]/g,'');
      const tn=(settings.telegram||'').replace('@','');
      document.getElementById('successWhatsapp').href=`https://wa.me/${wn}?text=${encodeURIComponent(msg)}`;
      document.getElementById('successTelegram').href=`https://t.me/${tn}`;
      document.getElementById('successModal').classList.add('open');
      document.body.style.overflow='hidden';
      clearCart();
    } else { showToast(data.error||'Order failed.','error'); btn.innerHTML=orig; btn.disabled=false; }
  } catch(e) { showToast('Connection error. Please try again.','error'); btn.innerHTML=orig; btn.disabled=false; }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow='';
}

document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',e=>{ if(e.target===o){ o.classList.remove('open'); document.body.style.overflow=''; } });
});

// ─── REVIEWS ────────────────────────────────────────
function renderReviews(reviews) {
  const track=document.getElementById('reviewsTrack');
  if (!track||!reviews.length) return;
  const cards=reviews.map(r=>`
    <div class="review-card">
      <div class="rc-header"><div class="rc-avatar">${r.avatar||r.name.slice(0,2).toUpperCase()}</div>
        <div><div class="rc-name">${r.name}</div><div class="rc-meta"><div class="rc-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>${r.verified?'<span class="rc-verified">✓ Verified</span>':''}</div></div></div>
      <p class="rc-comment">${r.comment}</p>
      <div class="rc-date">${new Date(r.date).toLocaleDateString('en-PK',{year:'numeric',month:'short',day:'numeric'})}</div>
    </div>`).join('');
  track.innerHTML=cards+cards;
}

// ─── STAR RATING ────────────────────────────────────
document.querySelectorAll('.star-rating i').forEach(star=>{
  star.addEventListener('click',()=>{ selectedRating=parseInt(star.dataset.val); updateStars(selectedRating); });
  star.addEventListener('mouseenter',()=>updateStars(parseInt(star.dataset.val)));
});
document.querySelector('.star-rating')?.addEventListener('mouseleave',()=>updateStars(selectedRating));
function updateStars(v) { document.querySelectorAll('.star-rating i').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.val)<=v)); }

async function submitReview() {
  const name=document.getElementById('reviewName').value.trim();
  const comment=document.getElementById('reviewComment').value.trim();
  if (!name||!comment||!selectedRating){ showToast('Please fill in all fields!','error'); return; }
  try {
    const res=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,rating:selectedRating,comment})});
    const d=await res.json();
    if(d.success){ document.getElementById('reviewName').value=''; document.getElementById('reviewComment').value=''; selectedRating=0; updateStars(0); showToast('✅ Review submitted for approval!'); }
    else showToast(d.error||'Failed.','error');
  } catch(e){ showToast('Connection error.','error'); }
}

// ─── FAQ ────────────────────────────────────────────
function renderFAQ(faq) {
  const list=document.getElementById('faqList');
  if (!list) return;
  list.innerHTML=faq.map(item=>`
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFAQ(this)">${item.question}<i class="fas fa-plus"></i></div>
      <div class="faq-a"><p>${item.answer}</p></div>
    </div>`).join('');
}
function toggleFAQ(el) {
  const item=el.parentElement, open=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
  if(!open) item.classList.add('open');
}

// ─── CHATBOT ────────────────────────────────────────
function toggleChat(){ const w=document.getElementById('chatWindow'); w.classList.toggle('open'); if(w.classList.contains('open')) document.getElementById('chatInput').focus(); }
function sendQuick(t){ document.getElementById('chatInput').value=t; sendChatMessage(); }
async function sendChatMessage(){
  const inp=document.getElementById('chatInput'); const msg=inp.value.trim(); if(!msg) return;
  inp.value=''; addChatMsg(msg,'user'); const typing=addTyping();
  try {
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
    const d=await res.json(); typing.remove(); addChatMsg(d.reply,'bot');
  } catch(e){ typing.remove(); addChatMsg('Sorry, connection error. Contact us directly!','bot'); }
}
function addChatMsg(text,type){
  const msgs=document.getElementById('chatMessages');
  const div=document.createElement('div'); div.className=`chat-msg ${type}-msg`;
  div.innerHTML=`${type==='bot'?'<div class="msg-avatar"><i class="fas fa-crosshairs"></i></div>':''}<div class="msg-content">${text}</div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div;
}
function addTyping(){
  const msgs=document.getElementById('chatMessages');
  const div=document.createElement('div'); div.className='chat-msg bot-msg';
  div.innerHTML='<div class="msg-avatar"><i class="fas fa-crosshairs"></i></div><div class="msg-content"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div;
}

// ─── COPY ───────────────────────────────────────────
function copyText(id){
  const el=document.getElementById(id); if(!el) return;
  navigator.clipboard.writeText(el.textContent).then(()=>showToast('📋 Copied!')).catch(()=>{ const r=document.createRange(); r.selectNode(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); document.execCommand('copy'); window.getSelection().removeAllRanges(); showToast('📋 Copied!'); });
}

// ─── TOAST ──────────────────────────────────────────
function showToast(msg,type='success'){
  const t=document.getElementById('toast'); t.textContent=msg; t.className=`toast show ${type}`;
  clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('show'),3500);
}

// ─── COUNTERS ───────────────────────────────────────
function initCounters(){
  document.querySelectorAll('.counter-anim').forEach(el=>{
    const tgt=parseInt(el.dataset.target||'0');
    let cur=0; const step=tgt/(2000/16);
    const t=setInterval(()=>{ cur=Math.min(cur+step,tgt); el.textContent=Math.floor(cur).toLocaleString(); if(cur>=tgt) clearInterval(t); },16);
  });
}

// ─── REVEAL ─────────────────────────────────────────
function initReveal(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

// ─── SMOOTH SCROLL ───────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',e=>{
    const t=document.querySelector(link.getAttribute('href'));
    if(t){ e.preventDefault(); window.scrollTo({top:t.offsetTop-80,behavior:'smooth'}); }
  });
});

// ══════════════════════════════════════════════════════
// CLICK-TO-EDIT SYSTEM
// ══════════════════════════════════════════════════════

function applyContent() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (contentMap[key] !== undefined) el.textContent = contentMap[key];
  });
}

// ── Edit Login ──
function showEditLogin() { document.getElementById('editLoginModal').classList.add('open'); document.body.style.overflow='hidden'; setTimeout(()=>document.getElementById('editAdminPw').focus(),100); }
function hideEditLogin() { document.getElementById('editLoginModal').classList.remove('open'); document.body.style.overflow=''; }

async function doEditLogin() {
  const pw = document.getElementById('editAdminPw').value;
  if (!pw) return;
  try {
    const res = await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const d = await res.json();
    if (d.token) {
      editToken = d.token;
      localStorage.setItem('teamesp_edit_token', editToken);
      hideEditLogin();
      document.getElementById('editAdminPw').value='';
      document.getElementById('editLoginErr').style.display='none';
      toggleEditMode(true);
    } else {
      document.getElementById('editLoginErr').style.display='block';
    }
  } catch(e) { document.getElementById('editLoginErr').style.display='block'; }
}

// ── Toggle Edit Mode ──
function toggleEditMode(on, silent=false) {
  editMode = on;
  const toolbar = document.getElementById('editToolbar');
  const loginBtn= document.getElementById('editLoginBtn');
  toolbar.style.display  = on ? 'block' : 'none';
  loginBtn.style.display = on ? 'none'  : 'flex';
  document.body.classList.toggle('edit-mode-active', on);

  if (on) {
    document.querySelectorAll('[data-key]').forEach(el => makeEditable(el));
    if (!silent) showToast('✏️ Edit Mode ON — Click any gold text to edit!');
  } else {
    document.querySelectorAll('[data-key]').forEach(el => removeEditable(el));
    editToken = null;
    localStorage.removeItem('teamesp_edit_token');
    showToast('Edit mode off.');
  }
}

function makeEditable(el) {
  el.classList.add('editable-active');
  el.setAttribute('contenteditable','true');
  el.setAttribute('spellcheck','false');

  el._onInput = () => {
    const key = el.dataset.key;
    clearTimeout(saveTimer);
    showSaveStatus('Saving...');
    saveTimer = setTimeout(()=>saveContent(key, el.textContent.trim()), 800);
  };
  el._onKeydown = e => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    if (e.key==='Escape') { el.blur(); }
  };
  el._onFocus = () => el.classList.add('editing');
  el._onBlur  = () => { el.classList.remove('editing'); const key=el.dataset.key; saveContent(key, el.textContent.trim()); };

  el.addEventListener('input',   el._onInput);
  el.addEventListener('keydown', el._onKeydown);
  el.addEventListener('focus',   el._onFocus);
  el.addEventListener('blur',    el._onBlur);
}

function removeEditable(el) {
  el.classList.remove('editable-active','editing');
  el.removeAttribute('contenteditable');
  el.removeEventListener('input',   el._onInput);
  el.removeEventListener('keydown', el._onKeydown);
  el.removeEventListener('focus',   el._onFocus);
  el.removeEventListener('blur',    el._onBlur);
}

async function saveContent(key, value) {
  if (!editToken) return;
  try {
    const res = await fetch('/api/content',{
      method:'PUT',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${editToken}`},
      body: JSON.stringify({ key, value })
    });
    const d = await res.json();
    if (d.success) { contentMap[key]=value; showSaveStatus('✅ Saved!'); setTimeout(()=>showSaveStatus(''),2000); }
    else if (res.status===401||res.status===403) { toggleEditMode(false); showToast('Session expired. Please login again.','error'); }
    else showSaveStatus('❌ Save failed');
  } catch(e) { showSaveStatus('❌ Connection error'); }
}

function showSaveStatus(msg) {
  const el = document.getElementById('editSaveStatus');
  if (el) el.textContent = msg;
}

// ─── INIT ────────────────────────────────────────────
loadData();
