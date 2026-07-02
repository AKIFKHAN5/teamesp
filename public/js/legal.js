/* ═══════════════════════════════════════════════
   LEGAL PAGES — Shared JS
   Branding load + click-to-edit (reuses admin auth)
═══════════════════════════════════════════════ */

let settings = {};
let contentMap = {};
let editMode = false;
let editToken = localStorage.getItem('teamesp_edit_token') || null;
let saveTimer = null;

function initTheme() {
  const saved = localStorage.getItem('teamesp_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}
initTheme();

async function loadLegalData() {
  try {
    const [sR, cR] = await Promise.all([fetch('/api/settings'), fetch('/api/content')]);
    settings = await sR.json();
    contentMap = await cR.json();
    applyBranding(settings);
    applyContent();
    if (editToken) toggleEditMode(true, true);
  } catch(e) { console.error(e); }
}

function applyBranding(s) {
  const logoSize = s.logo_size || 40;
  if (s.logo_url) {
    const ni = document.getElementById('navLogoIcon');
    const nm = document.getElementById('navLogoImg');
    if (ni && nm) { ni.style.display='none'; nm.src=s.logo_url; nm.style.display='block'; nm.style.height=logoSize+'px'; }
    const fi = document.getElementById('footerLogoIcon');
    const fm = document.getElementById('footerLogoImg');
    if (fi && fm) { fi.style.display='none'; fm.src=s.logo_url; fm.style.display='block'; }
  } else {
    const ni = document.getElementById('navLogoIcon');
    if (ni) { ni.style.width=logoSize+'px'; ni.style.height=logoSize+'px'; ni.style.fontSize=(logoSize*0.44)+'px'; }
  }
  if (s.favicon_url) {
    const fv = document.getElementById('faviconEl');
    if (fv) fv.href = s.favicon_url;
  }
  const lnk = (id,v) => { const el=document.getElementById(id); if(el) el.href=v; };
  lnk('nav-whatsapp', s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}` : '#');
  lnk('nav-telegram', s.telegram ? `https://t.me/${s.telegram.replace('@','')}` : '#');
  lnk('ft-whatsapp',  s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}` : '#');
  lnk('ft-telegram',  s.telegram ? `https://t.me/${s.telegram.replace('@','')}` : '#');
  lnk('legal-whatsapp', s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g,'')}` : '#');
  lnk('legal-telegram', s.telegram ? `https://t.me/${s.telegram.replace('@','')}` : '#');
}

function applyContent() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (contentMap[key] !== undefined) el.textContent = contentMap[key];
  });
}

// ─── Click-to-edit (shared with main site) ───────────
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
  el._onKeydown=e=>{ if(e.key==='Escape') el.blur(); };
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

function showToast(msg,type='success'){
  const t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.className=`toast show ${type}`;
  clearTimeout(window._tt); window._tt=setTimeout(()=>t.classList.remove('show'),3500);
}

// Hamburger (mobile menu) — minimal version for legal pages
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  }
});

loadLegalData();
