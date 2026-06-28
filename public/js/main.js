/* ═══════════════════════════════════════════════
   TEAM ESP — MAIN JAVASCRIPT
═══════════════════════════════════════════════ */

let selectedRating = 0;
let settings = {};

// ─── LOADER ──────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    document.body.style.overflow = '';
    initParticles();
    initCounters();
    initReveal();
    initParallax();
  }, 1800);
  document.body.style.overflow = 'hidden';
});

// ─── MOUSE PARALLAX ──────────────────────────────────
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Hero parallax layers
  const heroChar   = document.querySelector('.pubg-char');
  const heroGlow   = document.querySelector('.char-glow');
  const heroBgText = document.querySelector('.hero-bg-text');
  const heroLeft   = document.querySelector('.hero-left');
  const hfcCards   = document.querySelectorAll('.hfc');
  const particles  = document.getElementById('particles');

  // Subtle section floating elements
  const aboutCards  = document.querySelectorAll('.about-card');
  const stepIcons   = document.querySelectorAll('.step-icon');
  const payCards    = document.querySelectorAll('.payment-card');
  const sectionTitles = document.querySelectorAll('.section-title');

  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;
  let ticking = false;

  document.addEventListener('mousemove', e => {
    // Normalize to -1 → +1 from center
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!ticking) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  });

  function applyParallax() {
    ticking = false;
    // Smooth lerp
    curX += (mouseX - curX) * 0.06;
    curY += (mouseY - curY) * 0.06;

    const isHeroVisible = window.scrollY < window.innerHeight;

    // ── HERO — STRONG parallax ──────────────────────
    if (isHeroVisible) {
      if (heroChar) {
        heroChar.style.transform = `translate(${curX * -22}px, ${curY * -18}px)`;
        heroChar.style.filter = `drop-shadow(0 0 30px rgba(245,166,35,0.3)) drop-shadow(${curX * -4}px ${curY * -4}px 15px rgba(245,166,35,0.15))`;
      }
      if (heroGlow) {
        heroGlow.style.transform = `translate(calc(-50% + ${curX * -30}px), calc(-50% + ${curY * -25}px))`;
      }
      if (heroBgText) {
        heroBgText.style.transform = `translate(${curX * 12}px, ${curY * 8}px)`;
      }
      if (heroLeft) {
        heroLeft.style.transform = `translate(${curX * 8}px, ${curY * 6}px)`;
      }
      if (particles) {
        particles.style.transform = `translate(${curX * 15}px, ${curY * 10}px)`;
      }
      hfcCards.forEach((card, i) => {
        const depth = (i + 1) * 0.4;
        card.style.transform = `translate(${curX * 6 * depth}px, ${curY * 4 * depth}px)`;
      });
    }

    // ── GLOBAL SECTIONS — SUBTLE parallax ──────────
    aboutCards.forEach((el, i) => {
      const d = (i % 3 === 0) ? 0.8 : (i % 3 === 1) ? 1.2 : 0.6;
      el.style.transform = `translate(${curX * 4 * d}px, ${curY * 3 * d}px)`;
    });
    stepIcons.forEach((el, i) => {
      el.style.transform = `translate(${curX * (3 + i * 0.5)}px, ${curY * (2 + i * 0.4)}px)`;
    });
    payCards.forEach((el, i) => {
      const d = [0.6, 1.0, 0.8][i] || 0.8;
      el.style.transform = `translate(${curX * 5 * d}px, ${curY * 4 * d}px)`;
    });
    sectionTitles.forEach((el, i) => {
      const d = (i % 2 === 0) ? 1.5 : 1.0;
      el.style.transform = `translate(${curX * 3 * d}px, ${curY * 2 * d}px)`;
    });

    if (ticking === false) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }

  // Mobile tilt support (device orientation)
  window.addEventListener('deviceorientation', e => {
    if (e.beta === null || e.gamma === null) return;
    mouseX = Math.max(-1, Math.min(1, e.gamma / 20));
    mouseY = Math.max(-1, Math.min(1, (e.beta - 40) / 20));
  });
}

// ─── PARTICLES ───────────────────────────────────────
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const x = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = Math.random() * 15 + 10;
    const gold = Math.random() > 0.5;
    p.style.cssText = `
      left: ${x}%;
      bottom: -10px;
      width: ${size}px;
      height: ${size}px;
      background: ${gold ? '#f5a623' : '#ffffff'};
      opacity: ${gold ? 0.6 : 0.2};
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;
    container.appendChild(p);
  }
}

// ─── NAVBAR ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  updateActiveNav();
});

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 100;
  sections.forEach(sec => {
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    const id = sec.getAttribute('id');
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (link) {
      if (scrollY >= top && scrollY < top + height) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

// ─── HAMBURGER ───────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});
function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  const spans = hamburger.querySelectorAll('span');
  spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}

// ─── DATA LOADING ────────────────────────────────────
async function loadData() {
  try {
    const [settingsRes, productsRes, reviewsRes, faqRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/products'),
      fetch('/api/reviews'),
      fetch('/api/faq')
    ]);
    const s = await settingsRes.json();
    const products = await productsRes.json();
    const reviews = await reviewsRes.json();
    const faq = await faqRes.json();
    settings = s;
    applySettings(s);
    renderProducts(products);
    renderReviews(reviews);
    renderFAQ(faq);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

function applySettings(s) {
  const tagline = document.getElementById('hero-tagline');
  if (tagline) tagline.textContent = s.tagline || '';

  const tel = document.getElementById('nav-telegram');
  const wa  = document.getElementById('nav-whatsapp');
  const ig  = document.getElementById('nav-instagram');
  const dc  = document.getElementById('nav-discord');
  if (tel) tel.href = s.telegram ? `https://t.me/${s.telegram.replace('@', '')}` : '#';
  if (wa)  wa.href  = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}` : '#';
  if (ig)  ig.href  = s.instagram ? `https://instagram.com/${s.instagram}` : '#';
  if (dc)  dc.href  = s.discord ? `https://discord.gg/${s.discord}` : '#';

  const binId   = document.getElementById('binance-id');
  const binName = document.getElementById('binance-name');
  const epNum   = document.getElementById('easypaisa-num');
  const epName  = document.getElementById('easypaisa-name');
  const jcNum   = document.getElementById('jazzcash-num');
  const jcName  = document.getElementById('jazzcash-name');
  if (binId)   binId.textContent   = s.binance_id || '';
  if (binName) binName.textContent = s.binance_name || '';
  if (epNum)   epNum.textContent   = s.easypaisa || '';
  if (epName)  epName.textContent  = s.easypaisa_name || '';
  if (jcNum)   jcNum.textContent   = s.jazzcash || '';
  if (jcName)  jcName.textContent  = s.jazzcash_name || '';

  const ctTel  = document.getElementById('ct-telegram');
  const ctWa   = document.getElementById('ct-whatsapp');
  const ctIg   = document.getElementById('ct-instagram');
  const ctDc   = document.getElementById('ct-discord');
  const ctTelT = document.getElementById('ct-telegram-text');
  const ctWaT  = document.getElementById('ct-whatsapp-text');
  const ctIgT  = document.getElementById('ct-instagram-text');
  const ctDcT  = document.getElementById('ct-discord-text');
  if (ctTel)  ctTel.href  = s.telegram ? `https://t.me/${s.telegram.replace('@', '')}` : '#';
  if (ctWa)   ctWa.href   = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}` : '#';
  if (ctIg)   ctIg.href   = s.instagram ? `https://instagram.com/${s.instagram}` : '#';
  if (ctDc)   ctDc.href   = s.discord ? `https://discord.gg/${s.discord}` : '#';
  if (ctTelT) ctTelT.textContent = s.telegram || '';
  if (ctWaT)  ctWaT.textContent  = s.whatsapp || '';
  if (ctIgT)  ctIgT.textContent  = s.instagram || '';
  if (ctDcT)  ctDcT.textContent  = s.discord || '';

  const ftTel = document.getElementById('ft-telegram');
  const ftWa  = document.getElementById('ft-whatsapp');
  const ftIg  = document.getElementById('ft-instagram');
  const ftDc  = document.getElementById('ft-discord');
  if (ftTel) ftTel.href = s.telegram ? `https://t.me/${s.telegram.replace('@', '')}` : '#';
  if (ftWa)  ftWa.href  = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}` : '#';
  if (ftIg)  ftIg.href  = s.instagram ? `https://instagram.com/${s.instagram}` : '#';
  if (ftDc)  ftDc.href  = s.discord ? `https://discord.gg/${s.discord}` : '#';

  const sc = document.getElementById('stat-customers');
  if (sc) sc.setAttribute('data-target', parseInt(s.happy_customers || '5000'));
  const sr = document.getElementById('stat-rating');
  if (sr) sr.textContent = (s.rating || '4.9/5').split('/')[0];
}

// ─── PRODUCTS ────────────────────────────────────────
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const iconMap = {
    day: 'fa-calendar-day',
    week: 'fa-calendar-week',
    month: 'fa-calendar-alt'
  };
  grid.innerHTML = products.map(p => `
    <div class="product-card ${p.badge === 'POPULAR' || p.badge === 'BEST VALUE' ? 'featured' : ''}">
      ${p.badge ? `<div class="pc-badge">${p.badge}</div>` : ''}
      <div class="pc-top">
        ${p.main_image
          ? `<img src="${p.main_image}" class="pc-main-img" alt="${p.name}" onerror="this.style.display='none'">`
          : `<i class="fas ${iconMap[p.icon] || 'fa-calendar'} pc-icon"></i>`
        }
        <div class="pc-name">${p.duration || p.name}</div>
        <div class="pc-sub">SUBSCRIPTION</div>
      </div>
      <div class="pc-body">
        <p class="pc-desc">${p.description || ''}</p>
        <div class="pc-price">
          <span class="pc-price-pkr">PKR ${Number(p.price_pkr).toLocaleString()}</span>
          <span class="pc-price-divider">/</span>
          <span class="pc-price-usdt">$${p.price_usdt} USDT</span>
        </div>
        <p class="pc-price-label">Price: PKR / USDT</p>
        <div class="pc-btns">
          <button class="btn-outline pc-details-btn" onclick="window.location.href='/product/${p.id}'">
            <i class="fas fa-eye"></i> VIEW DETAILS
          </button>
          <button class="btn-primary" onclick="openOrderModal(${p.id}, '${p.name}', ${p.price_pkr}, ${p.price_usdt})">
            <i class="fas fa-shopping-cart"></i> BUY NOW
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── REVIEWS ────────────────────────────────────────
function renderReviews(reviews) {
  const track = document.getElementById('reviewsTrack');
  if (!track || !reviews.length) return;
  const cards = reviews.map(r => `
    <div class="review-card">
      <div class="rc-header">
        <div class="rc-avatar">${r.avatar || r.name.slice(0,2).toUpperCase()}</div>
        <div>
          <div class="rc-name">${r.name}</div>
          <div class="rc-meta">
            <div class="rc-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            ${r.verified ? '<span class="rc-verified">✓ Verified</span>' : ''}
          </div>
        </div>
      </div>
      <p class="rc-comment">${r.comment}</p>
      <div class="rc-date">${formatDate(r.date)}</div>
    </div>
  `).join('');
  track.innerHTML = cards + cards;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── FAQ ────────────────────────────────────────────
function renderFAQ(faq) {
  const list = document.getElementById('faqList');
  if (!list) return;
  list.innerHTML = faq.map(item => `
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFAQ(this)">
        ${item.question}
        <i class="fas fa-plus"></i>
      </div>
      <div class="faq-a"><p>${item.answer}</p></div>
    </div>
  `).join('');
}

function toggleFAQ(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ─── ORDER MODAL ────────────────────────────────────
function openOrderModal(productId, productName, pricePkr, priceUsdt) {
  document.getElementById('orderProductId').value = productId;
  document.getElementById('modalProductInfo').innerHTML = `
    <div>${productName} — <strong>PKR ${Number(pricePkr).toLocaleString()}</strong> / <strong>$${priceUsdt} USDT</strong></div>
  `;
  document.getElementById('orderName').value = '';
  document.getElementById('orderContact').value = '';
  document.getElementById('orderPubgId').value = '';
  document.getElementById('orderPayment').value = '';
  document.getElementById('orderNotes').value = '';
  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function submitOrder() {
  const product_id     = document.getElementById('orderProductId').value;
  const customer_name  = document.getElementById('orderName').value.trim();
  const customer_contact = document.getElementById('orderContact').value.trim();
  const pubg_id        = document.getElementById('orderPubgId').value.trim();
  const payment_method = document.getElementById('orderPayment').value;
  const notes          = document.getElementById('orderNotes').value.trim();

  if (!customer_name || !customer_contact || !pubg_id || !payment_method) {
    showToast('Please fill all required fields!', 'error');
    return;
  }

  const btn = document.querySelector('#orderModal .full-btn');
  const origText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, customer_name, customer_contact, pubg_id, payment_method, notes })
    });
    const data = await res.json();
    if (data.success) {
      closeOrderModal();
      document.getElementById('orderIdDisplay').textContent = data.order_id;
      const msg = `Team ESP Order\nOrder ID: ${data.order_id}\nPUBG ID: ${pubg_id}\nPayment: ${payment_method}`;
      const wn  = (settings.whatsapp || '').replace(/[^0-9]/g, '');
      const tn  = (settings.telegram || '').replace('@', '');
      document.getElementById('successWhatsapp').href = `https://wa.me/${wn}?text=${encodeURIComponent(msg)}`;
      document.getElementById('successTelegram').href = `https://t.me/${tn}`;
      document.getElementById('successModal').classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      showToast(data.error || 'Order failed. Try again.', 'error');
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  } catch (e) {
    showToast('Connection error. Please try again.', 'error');
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// ─── STAR RATING ────────────────────────────────────
const stars = document.querySelectorAll('.star-rating i');
stars.forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.getAttribute('data-val'));
    updateStars(selectedRating);
  });
  star.addEventListener('mouseenter', () => updateStars(parseInt(star.getAttribute('data-val'))));
});
document.querySelector('.star-rating')?.addEventListener('mouseleave', () => updateStars(selectedRating));
function updateStars(val) {
  stars.forEach(s => {
    s.classList.toggle('active', parseInt(s.getAttribute('data-val')) <= val);
  });
}

// ─── REVIEW SUBMIT ───────────────────────────────────
async function submitReview() {
  const name    = document.getElementById('reviewName').value.trim();
  const comment = document.getElementById('reviewComment').value.trim();
  if (!name || !comment || !selectedRating) {
    showToast('Please fill in all fields and select a rating!', 'error');
    return;
  }
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rating: selectedRating, comment })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('reviewName').value = '';
      document.getElementById('reviewComment').value = '';
      selectedRating = 0;
      updateStars(0);
      showToast('✅ Review submitted! It will appear after approval.', 'success');
    } else {
      showToast(data.error || 'Failed to submit review.', 'error');
    }
  } catch (e) {
    showToast('Connection error. Please try again.', 'error');
  }
}

// ─── CHATBOT ────────────────────────────────────────
function toggleChat() {
  const win = document.getElementById('chatWindow');
  win.classList.toggle('open');
  if (win.classList.contains('open')) document.getElementById('chatInput').focus();
}

function sendQuick(text) {
  document.getElementById('chatInput').value = text;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addChatMsg(msg, 'user');
  const typing = addTyping();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    typing.remove();
    addChatMsg(data.reply, 'bot');
  } catch (e) {
    typing.remove();
    addChatMsg('Sorry, could not connect. Please contact us directly!', 'bot');
  }
}

function addChatMsg(text, type) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${type}-msg`;
  div.innerHTML = `
    ${type === 'bot' ? '<div class="msg-avatar"><i class="fas fa-crosshairs"></i></div>' : ''}
    <div class="msg-content">${text}</div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTyping() {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot-msg';
  div.innerHTML = `
    <div class="msg-avatar"><i class="fas fa-crosshairs"></i></div>
    <div class="msg-content"><div class="chat-typing"><span></span><span></span><span></span></div></div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ─── COPY TEXT ───────────────────────────────────────
function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    showToast('📋 Copied to clipboard!');
  }).catch(() => {
    const range = document.createRange();
    range.selectNode(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    showToast('📋 Copied!');
  });
}

// ─── TOAST ──────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── COUNTERS ───────────────────────────────────────
function initCounters() {
  document.querySelectorAll('.counter-anim').forEach(el => {
    const target = parseInt(el.getAttribute('data-target') || '0');
    animateCounter(el, target);
  });
}

function animateCounter(el, target) {
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

// ─── REVEAL ─────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── SMOOTH SCROLL ───────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

// ─── INIT ────────────────────────────────────────────
loadData();
