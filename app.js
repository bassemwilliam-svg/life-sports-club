// =============================================================================
// LSC Demo — Shared interactivity
// =============================================================================

// ---------- Language toggle (EN/AR with RTL flip) ----------
// State persists in localStorage so Arabic stays on as you navigate between pages
function toggleLang() {
  const current = localStorage.getItem('lsc-lang') || 'en';
  const next = current === 'ar' ? 'en' : 'ar';
  localStorage.setItem('lsc-lang', next);
  applyLang(next);
}
function applyLang(lang) {
  const html = document.documentElement;
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  html.setAttribute('lang', lang);
  applyI18n(lang);
  // Update every visible toggle button (the navbar one + the drawer copy)
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
  });
}
function applyI18n(lang) {
  const dict = (window.LSC && window.LSC.i18n[lang]) || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (dict[k]) el.innerHTML = dict[k];
  });
}
// Apply saved language on every page load
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lsc-lang') || 'en';
  applyLang(saved);
});

// ---------- Programs filter ----------
function filterPrograms(category, ev) {
  document.querySelectorAll('.chip[data-cat]').forEach(c => c.classList.remove('active'));
  if (ev) ev.currentTarget.classList.add('active');
  document.querySelectorAll('[data-sport-cat]').forEach(card => {
    const cat = card.getAttribute('data-sport-cat');
    card.style.display = (category === 'all' || cat === category) ? '' : 'none';
  });
}

// ---------- STEM event countdown ----------
function startCountdown(targetISO, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const target = new Date(targetISO).getTime();
  function tick() {
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    el.innerHTML = `
      <div class="cd-cell"><span class="cd-num">${d}</span><span class="cd-lbl">Days</span></div>
      <div class="cd-cell"><span class="cd-num">${String(h).padStart(2,'0')}</span><span class="cd-lbl">Hrs</span></div>
      <div class="cd-cell"><span class="cd-num">${String(m).padStart(2,'0')}</span><span class="cd-lbl">Min</span></div>
      <div class="cd-cell"><span class="cd-num">${String(s).padStart(2,'0')}</span><span class="cd-lbl">Sec</span></div>`;
  }
  tick();
  setInterval(tick, 1000);
}

// ---------- Traffic light animation (the actual logic the kids will write) ----------
function startTrafficLight() {
  const lights = ['red', 'yellow', 'green'];
  let i = 0;
  // Sequence: RED 4s -> GREEN 4s -> YELLOW 1.5s -> repeat
  const sequence = [
    { active: 'red',    duration: 4000 },
    { active: 'green',  duration: 4000 },
    { active: 'yellow', duration: 1500 },
  ];
  let step = 0;
  function next() {
    const cur = sequence[step % sequence.length];
    lights.forEach(l => {
      const el = document.querySelector('.tl-' + l);
      if (el) el.classList.toggle('on', l === cur.active);
    });
    step++;
    setTimeout(next, cur.duration);
  }
  next();
}

// ---------- Family bundle pricing calculator ----------
function calcBundle() {
  const adults = parseInt(document.getElementById('adults')?.value || 1);
  const kids   = parseInt(document.getElementById('kids')?.value   || 0);
  const out    = document.getElementById('bundleTotal');
  if (!out) return;
  // Pricing: 28k/adult, 12k/kid, family bundle -15% if 3+
  let total = adults * 28000 + kids * 12000;
  const total_people = adults + kids;
  const discount = total_people >= 3 ? 0.15 : 0;
  const final = Math.round(total * (1 - discount));
  out.innerHTML = `
    <div class="bundle-row"><span>${adults} adult${adults !== 1 ? 's' : ''}</span><span>EGP ${(adults*28000).toLocaleString()}</span></div>
    <div class="bundle-row"><span>${kids} kid${kids !== 1 ? 's' : ''}</span><span>EGP ${(kids*12000).toLocaleString()}</span></div>
    ${discount ? `<div class="bundle-row" style="color:var(--lsc-green)"><span>Family bundle saving (15%)</span><span>−EGP ${Math.round(total * 0.15).toLocaleString()}</span></div>` : ''}
    <div class="bundle-row bundle-total"><span>Total / year</span><span>EGP ${final.toLocaleString()}</span></div>`;
}

// ---------- Quiz logic ----------
const quizState = { answers: {}, step: 0 };
function quizAnswer(q, val) {
  quizState.answers[q] = val;
  quizState.step++;
  const next = document.getElementById('quiz-step-' + (quizState.step + 1));
  const cur  = document.getElementById('quiz-step-' + quizState.step);
  if (cur) cur.style.display = 'none';
  if (next) next.style.display = 'block';
  else showQuizResult();
}
function showQuizResult() {
  const a = quizState.answers;
  let pick;
  if (a.energy === 'team' && a.indoor === 'outdoor') pick = 'football';
  else if (a.energy === 'team' && a.indoor === 'indoor') pick = 'basketball';
  else if (a.energy === 'solo' && a.intensity === 'high') pick = 'crossfit';
  else if (a.energy === 'solo' && a.indoor === 'aquatic') pick = 'swimming';
  else if (a.energy === 'solo') pick = 'tennis';
  else pick = 'yoga';
  const sport = window.LSC.sports.find(s => s.id === pick);
  const out = document.getElementById('quiz-result');
  out.style.display = 'block';
  out.innerHTML = `
    <div class="eyebrow">Your match</div>
    <h2 style="font-size:3rem;margin:0 0 0.5rem">${sport.icon} ${sport.name}</h2>
    <p style="color:var(--lsc-gray-light);max-width:480px;margin:0 auto 1.5rem;">Based on your answers, ${sport.name} is your ideal program. ${sport.coach} is ready to welcome you.</p>
    <a class="btn btn-primary" href="program-detail.html?sport=${sport.id}">View ${sport.name} program →</a>`;
}

// ---------- Modal ----------
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// ---------- Toast ----------
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '6rem', right: '1.5rem', zIndex: 200,
    background: 'var(--lsc-green)', color: 'var(--lsc-black)',
    padding: '1rem 1.4rem', borderRadius: '12px', fontWeight: '700',
    boxShadow: '0 10px 40px rgba(68,214,44,0.4)',
    animation: 'slideUp 0.3s ease',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ---------- Mobile screen switcher ----------
function showMobileScreen(id) {
  document.querySelectorAll('.m-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('m-' + id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector('.m-tab[data-screen="' + id + '"]');
  if (tab) tab.classList.add('active');
  // Update screen list selector
  const sel = document.getElementById('screen-jump');
  if (sel) sel.value = id;
}

// ---------- Capacity pill helper ----------
function capPill(spots) {
  if (spots === 0) return '<span class="cap cap-full">● Full · join waitlist</span>';
  if (spots <= 5) return `<span class="cap cap-low">● ${spots} spots left</span>`;
  return `<span class="cap cap-ok">● ${spots} spots open</span>`;
}

// ---------- Member-portal side-nav: smooth-scroll + active state ----------
function navTo(el, anchor) {
  document.querySelectorAll('.side-nav .item').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  const target = document.getElementById(anchor);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Mobile hamburger menu (auto-mounts on every page) ----------
function mountMobileMenu() {
  const navbar = document.querySelector('.navbar');
  if (!navbar || navbar.querySelector('.menu-btn')) return; // skip admin/login pages without standard nav, or already mounted

  const links = navbar.querySelector('.navbar-links');
  if (!links) return;

  // Hamburger button
  const btn = document.createElement('button');
  btn.className = 'menu-btn';
  btn.setAttribute('aria-label', 'Open menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  navbar.appendChild(btn);

  // Drawer
  const drawer = document.createElement('div');
  drawer.className = 'mobile-drawer';
  const logoHTML = navbar.querySelector('.navbar-logo')?.outerHTML || '';
  drawer.innerHTML = `
    <div class="drawer-overlay"></div>
    <div class="drawer-panel">
      <div class="drawer-head">
        ${logoHTML}
        <button class="drawer-close" aria-label="Close menu">&times;</button>
      </div>
      <nav class="drawer-links">
        ${links.innerHTML}
      </nav>
      <div class="drawer-actions">
        <button class="chip lang-toggle" onclick="toggleLang()" style="align-self:start;">عربي</button>
        <a class="btn btn-ghost" href="login.html">Member Login</a>
        <a class="btn btn-primary" href="membership.html">Become a Member</a>
        <div class="drawer-meta">Life Sports Club · New Cairo<br/>info@lifesportsclub.com</div>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  function close() { drawer.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = ''; }
  function open()  { drawer.classList.add('open'); btn.classList.add('open'); document.body.style.overflow = 'hidden'; }

  btn.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  drawer.querySelector('.drawer-overlay').addEventListener('click', close);
  drawer.querySelector('.drawer-close').addEventListener('click', close);
  drawer.querySelectorAll('.drawer-links a').forEach(a => a.addEventListener('click', close));
  // Close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}
document.addEventListener('DOMContentLoaded', mountMobileMenu);
