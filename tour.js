// =============================================================================
// LSC Demo — Guided product tour
// Cross-page, localStorage-tracked. Auto-opens on first visit (homepage).
// =============================================================================

(function () {
  const STORAGE_ACTIVE = 'lsc-tour-active';
  const STORAGE_STEP   = 'lsc-tour-step';
  const STORAGE_DONE   = 'lsc-tour-completed';

  // Each step targets one element on a specific page. Keep value props punchy.
  const STEPS = [
    {
      page: 'index.html',
      target: '.hero-inner > div:first-child',
      placement: 'right',
      title: 'Welcome to the new LSC',
      body: 'A 90-second guided tour of what\'s possible. Every section is a real, working demo of features Genesis will deliver — homepage, mobile app, watch, member portal, admin console.',
    },
    {
      page: 'index.html',
      target: '.hero-cards',
      placement: 'left',
      title: 'Live activity, surfaced',
      body: 'These cards stream from the backend in real time — a court booking filling up, a featured event, a facility just opened. Members never miss what\'s happening.',
    },
    {
      page: 'index.html',
      target: '.event-banner',
      placement: 'top',
      title: 'Cinematic event landing pages',
      body: 'Click in to see how the STEM Robotics Workshop becomes a full landing page — animated traffic light, live countdown, spots-remaining counter, sticky reserve CTA. Every event you propose can look this good.',
    },
    {
      page: 'index.html',
      target: '.app-cta',
      placement: 'top',
      title: 'Phone + Watch experience',
      body: 'iOS, Android, Apple Watch and Wear OS. Live heart rate streams to the app, members opt in to share with their coach per session. QR membership card, family switcher, parking alerts — all in one ecosystem.',
    },
    {
      page: 'programs.html',
      target: '.cat-section[data-cat-section="racket"]',
      placement: 'top',
      title: '20+ programs, properly categorised',
      body: 'Sports grouped by category — Team, Racket, Aquatic, Fitness, Martial Arts, Individual, Mind & Strategy. Live capacity badges drive bookings. Tap any sport for the full program detail.',
    },
    {
      page: 'facilities.html',
      target: '.map-stage',
      placement: 'bottom',
      title: 'Interactive 3D club map',
      body: 'Hover any zone — Olympic pool, tennis courts, gym, cafe, STEM lab — for live availability and one-click booking into that facility. Same isometric look as the existing LSC site, but interactive.',
    },
    {
      page: 'event-stem.html',
      target: '.event-hero',
      placement: 'bottom',
      title: 'STEM Robotics, on platform',
      body: 'The Smart Traffic Light workshop ships its own immersive landing page — with the actual code that runs the build, age-track switcher, take-home kit highlight, parents demo day card, and proof stats from past cohorts.',
    },
    {
      page: 'member-portal.html',
      target: '.tile-grid',
      placement: 'bottom',
      title: 'The member dashboard',
      body: 'Digital QR membership card, Life Points loyalty engine, active streak, family management, upcoming bookings, recent activity. Everything members need on their first tap after logging in.',
    },
    {
      page: 'app.html',
      target: '.phone-stage',
      placement: 'left',
      title: 'Mobile app · 14 screens',
      body: 'Click any screen on the left. Splash with auto check-in, home feed with parking, booking flow with waitlist, wallet card, family switcher, cafeteria pre-order, coach DM, progress dashboard, birthday party wizard, and the new Connected Devices + Live Training screens.',
    },
    {
      page: 'admin.html',
      target: '.upload-zone',
      placement: 'top',
      title: 'Non-technical admin console',
      body: 'Your team uploads media, drags into albums, clicks "Publish to Web + App" — assets appear live within seconds. No developer required. KPI dashboard up top: live bookings, members on-site, cafe revenue, app users.',
    },
    {
      page: 'index.html',
      target: '.app-cta',
      placement: 'top',
      title: 'Ready to make it real?',
      body: 'You\'ve seen everything in the proposal — and a lot more we built on top. Genesis is ready to start the moment you sign. Let\'s talk pricing and timeline.',
      lastStep: true,
    },
  ];

  const TOTAL = STEPS.length;
  let currentIndex = 0;
  let dom = null;

  function getStorage(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function setStorage(key, val) { try { localStorage.setItem(key, val); } catch {} }

  function currentPage() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p === '' ? 'index.html' : p;
  }

  function ensureDom() {
    if (dom) return dom;
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.innerHTML = `
      <div class="tour-spotlight"></div>
      <div class="tour-tooltip">
        <div class="tour-progress"></div>
        <div class="step-counter"></div>
        <h3></h3>
        <p></p>
        <div class="tour-actions">
          <button class="btn btn-ghost prev" type="button">Back</button>
          <button class="btn btn-primary next" type="button">Next</button>
          <button class="skip" type="button">Skip tour</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    dom = {
      overlay,
      spotlight: overlay.querySelector('.tour-spotlight'),
      tooltip: overlay.querySelector('.tour-tooltip'),
      progress: overlay.querySelector('.tour-progress'),
      counter: overlay.querySelector('.step-counter'),
      title: overlay.querySelector('h3'),
      body: overlay.querySelector('p'),
      prev: overlay.querySelector('.prev'),
      next: overlay.querySelector('.next'),
      skip: overlay.querySelector('.skip'),
    };
    dom.prev.addEventListener('click', goPrev);
    dom.next.addEventListener('click', goNext);
    dom.skip.addEventListener('click', stop);
    document.addEventListener('keydown', e => {
      if (!isActive()) return;
      if (e.key === 'Escape') stop();
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });
    window.addEventListener('resize', () => { if (isActive()) renderStep(); });
    return dom;
  }

  function isActive() { return getStorage(STORAGE_ACTIVE) === '1'; }

  function start() {
    setStorage(STORAGE_ACTIVE, '1');
    setStorage(STORAGE_STEP, '0');
    setStorage(STORAGE_DONE, '');
    if (currentPage() !== STEPS[0].page) {
      window.location.href = STEPS[0].page;
      return;
    }
    showCurrent();
  }

  function stop(completed) {
    setStorage(STORAGE_ACTIVE, '');
    if (completed) setStorage(STORAGE_DONE, '1');
    if (dom) dom.overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Hide launcher on homepage if completed
    const launcher = document.querySelector('.tour-launcher');
    if (launcher && completed) launcher.style.display = 'none';
  }

  function goNext() {
    const step = STEPS[currentIndex];
    if (step.lastStep) { stop(true); return; }
    setStep(currentIndex + 1);
  }
  function goPrev() {
    if (currentIndex === 0) return;
    setStep(currentIndex - 1);
  }
  function setStep(i) {
    if (i < 0 || i >= TOTAL) return;
    currentIndex = i;
    setStorage(STORAGE_STEP, String(i));
    const step = STEPS[i];
    if (currentPage() !== step.page) {
      window.location.href = step.page;
      return;
    }
    showCurrent();
  }

  function showCurrent() {
    const step = STEPS[currentIndex];
    const target = step.target ? document.querySelector(step.target) : null;
    if (!target) {
      // If target not found, retry shortly (page may still be rendering)
      setTimeout(showCurrent, 250);
      return;
    }
    ensureDom();
    document.body.style.overflow = 'hidden';
    dom.overlay.classList.add('active');

    // Position spotlight around target
    const rect = target.getBoundingClientRect();
    const pad = 12;
    const top  = rect.top + window.scrollY - pad;
    const left = rect.left + window.scrollX - pad;
    const w    = rect.width + pad * 2;
    const h    = rect.height + pad * 2;
    Object.assign(dom.spotlight.style, {
      top: top + 'px', left: left + 'px',
      width: w + 'px', height: h + 'px',
    });

    // Position tooltip near target with viewport clamping
    const tipW = 380;
    const tipH = 280;
    let tipTop, tipLeft;
    const place = step.placement || 'bottom';
    if (place === 'right') { tipTop = top; tipLeft = left + w + 20; }
    else if (place === 'left') { tipTop = top; tipLeft = Math.max(20, left - tipW - 20); }
    else if (place === 'top') { tipTop = top - tipH - 20; tipLeft = left; }
    else { tipTop = top + h + 20; tipLeft = left; }
    // Clamp to viewport
    tipLeft = Math.max(20, Math.min(tipLeft, window.innerWidth - tipW - 20));
    tipTop  = Math.max(window.scrollY + 80, Math.min(tipTop, window.scrollY + window.innerHeight - tipH));
    Object.assign(dom.tooltip.style, { top: tipTop + 'px', left: tipLeft + 'px' });

    // Scroll target into view if off-screen
    if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Fill content
    dom.counter.textContent = `STEP ${currentIndex + 1} OF ${TOTAL}`;
    dom.title.textContent = step.title;
    dom.body.innerHTML = step.body;
    dom.progress.innerHTML = STEPS.map((_, i) => `<span class="pip ${i <= currentIndex ? 'done' : ''}"></span>`).join('');
    dom.prev.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    dom.next.textContent = step.lastStep ? 'Finish' : 'Next';
  }

  // Auto-resume if tour is active and we landed on a different page
  function resume() {
    if (!isActive()) return;
    const savedIdx = parseInt(getStorage(STORAGE_STEP) || '0', 10);
    currentIndex = isNaN(savedIdx) ? 0 : savedIdx;
    const step = STEPS[currentIndex];
    if (!step) { stop(); return; }
    if (currentPage() === step.page) {
      showCurrent();
    }
    // If on a different page (e.g. user clicked away), do nothing — they'll resume when they return
  }

  // Add the floating launcher to the homepage (only if not already mounted and not completed)
  function mountLauncher() {
    if (currentPage() !== 'index.html') return;
    if (document.querySelector('.tour-launcher')) return;
    if (getStorage(STORAGE_DONE) === '1' && !isActive()) return;
    const btn = document.createElement('button');
    btn.className = 'tour-launcher';
    btn.innerHTML = '<span class="dot"></span> Take the 90-sec tour';
    btn.addEventListener('click', start);
    document.body.appendChild(btn);
  }

  // Public API
  window.LSCTour = { start, stop, resume };

  document.addEventListener('DOMContentLoaded', () => {
    mountLauncher();
    // Auto-start on first visit to the homepage
    if (currentPage() === 'index.html' && !isActive() && getStorage(STORAGE_DONE) !== '1') {
      // Delay so the page has time to render and user gets a moment to see the homepage
      setTimeout(() => {
        if (!isActive() && getStorage(STORAGE_DONE) !== '1' && getStorage('lsc-tour-prompted') !== '1') {
          setStorage('lsc-tour-prompted', '1');
          start();
        }
      }, 1500);
    } else {
      resume();
    }
  });
})();
