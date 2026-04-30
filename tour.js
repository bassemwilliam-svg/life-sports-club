// =============================================================================
// LSC Demo — Guided product tour (v3 — tight, centered welcomes, smooth nav)
// =============================================================================
//
// Design principles:
//   • Welcome and closing steps are CENTERED cards (no spotlight) — nothing
//     to highlight, just a punchy intro/outro.
//   • Spotlight steps target the smallest element that conveys the message,
//     not whole hero sections, so the tooltip always has room to breathe.
//   • Cross-page navigation shows a "Going to [page]…" sheet for ~600 ms so
//     the dark overlay carries through the page reload — no white flash.
//   • Copy is one-line value, max ~20 words. Stakeholders read every word.
//   • Mobile (< 768px) uses bottom-sheet mode for everything — never a tiny
//     spotlight on a tiny screen.
// =============================================================================

(function () {
  'use strict';

  const STORAGE_ACTIVE = 'lsc-tour-active';
  const STORAGE_STEP   = 'lsc-tour-step';
  const STORAGE_DONE   = 'lsc-tour-completed';
  const STORAGE_PROMPT = 'lsc-tour-prompted';
  const STORAGE_NAV    = 'lsc-tour-navigating';
  const MOBILE_BREAK   = 768;

  // 11 steps. centered:true = welcome/outro card with no spotlight.
  // Targets are small + specific. Copy is tight.
  const STEPS = [
    {
      page: 'index.html',
      centered: true,
      title: 'Welcome to LSC.',
      body: 'A 90-second tour of the website, mobile app, watch app, member portal, and admin console.',
      pageLabel: 'Homepage',
    },
    {
      page: 'index.html',
      target: '.hero-cards',
      mobileSheet: true,
      placement: 'left',
      title: 'Live activity',
      body: 'Real-time bookings, featured events, and just-opened facilities — streamed from the backend.',
      pageLabel: 'Homepage',
    },
    {
      page: 'index.html',
      target: '.event-banner',
      placement: 'top',
      title: 'Cinematic event pages',
      body: 'Every workshop becomes its own immersive landing page. Tap to see the STEM Robotics demo.',
      pageLabel: 'Homepage',
    },
    {
      page: 'index.html',
      target: '.app-mock',
      mobileSheet: true,
      placement: 'right',
      title: 'Phone + Apple Watch',
      body: 'Live heart rate to your coach with consent. Bookings in two taps. One ecosystem.',
      pageLabel: 'Homepage',
    },
    {
      page: 'programs.html',
      target: '.cat-head',
      placement: 'bottom',
      title: 'Sports, grouped properly',
      body: '20+ programs across 7 categories. Live capacity badges drive bookings.',
      pageLabel: 'Programs',
    },
    {
      page: 'facilities.html',
      target: '.map-stage',
      placement: 'right',
      mobileSheet: true,
      title: 'Interactive 3D club map',
      body: 'Hover any zone for live availability and one-click booking.',
      pageLabel: 'Facilities',
    },
    {
      page: 'event-stem.html',
      target: '.event-hero h1',
      placement: 'bottom',
      title: 'STEM Robotics, on platform',
      body: 'Animated traffic light, live countdown, take-home Arduino kit, parents demo day.',
      pageLabel: 'STEM Event',
    },
    {
      page: 'member-portal.html',
      target: '.tile-grid',
      placement: 'bottom',
      title: 'Member dashboard',
      body: 'Digital QR card, Life Points loyalty, streak, family management — first tap after login.',
      pageLabel: 'Member Portal',
    },
    {
      page: 'app.html',
      target: '.screen-list',
      mobileSheet: true,
      placement: 'right',
      title: 'Mobile app · 14 screens',
      body: 'Click any screen — bookings, wallet card, coach DM, live training, watch pairing.',
      pageLabel: 'Mobile App',
    },
    {
      page: 'admin.html',
      target: '.upload-zone',
      placement: 'top',
      title: 'Non-technical admin',
      body: 'Drag, drop, click "Publish to Web + App". No developer needed.',
      pageLabel: 'Admin Console',
    },
    {
      page: 'index.html',
      centered: true,
      lastStep: true,
      title: 'Ready to make it real?',
      body: "You've seen everything in the proposal — and a lot more we built on top. Let's talk.",
      pageLabel: 'Homepage',
    },
  ];

  const TOTAL = STEPS.length;
  let currentIndex = 0;
  let dom = null;
  let scrollRaf = 0;

  // ------- Storage helpers -------
  function get(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  function clr(k)   { try { localStorage.removeItem(k); } catch {} }

  function isActive() { return get(STORAGE_ACTIVE) === '1'; }
  function isMobile() { return window.innerWidth < MOBILE_BREAK; }
  function currentPage() {
    const p = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return p === '' ? 'index.html' : p;
  }

  // ------- DOM (one-time mount) -------
  function ensureDom() {
    if (dom) return dom;
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="tour-backdrop"></div>' +
      '<div class="tour-spotlight" aria-hidden="true"></div>' +
      '<div class="tour-tooltip">' +
        '<div class="tour-progress"></div>' +
        '<div class="step-counter"></div>' +
        '<h3></h3>' +
        '<p></p>' +
        '<div class="tour-actions">' +
          '<button class="btn btn-ghost prev" type="button">Back</button>' +
          '<button class="btn btn-primary next" type="button">Next</button>' +
          '<button class="skip" type="button">Skip tour</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    dom = {
      overlay,
      backdrop:  overlay.querySelector('.tour-backdrop'),
      spotlight: overlay.querySelector('.tour-spotlight'),
      tooltip:   overlay.querySelector('.tour-tooltip'),
      progress:  overlay.querySelector('.tour-progress'),
      counter:   overlay.querySelector('.step-counter'),
      title:     overlay.querySelector('h3'),
      body:      overlay.querySelector('p'),
      prev:      overlay.querySelector('.prev'),
      next:      overlay.querySelector('.next'),
      skip:      overlay.querySelector('.skip'),
    };

    dom.prev.addEventListener('click', goPrev);
    dom.next.addEventListener('click', goNext);
    dom.skip.addEventListener('click', () => stop(false));
    dom.backdrop.addEventListener('click', () => stop(false));

    document.addEventListener('keydown', e => {
      if (!isActive()) return;
      if (e.key === 'Escape') { e.preventDefault(); stop(false); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    });

    window.addEventListener('resize', queueReflow);
    window.addEventListener('scroll', queueReflow, { passive: true });

    return dom;
  }

  function queueReflow() {
    if (!isActive()) return;
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => renderCurrent());
  }

  // ------- Public API -------
  function start() {
    set(STORAGE_ACTIVE, '1');
    set(STORAGE_STEP, '0');
    clr(STORAGE_DONE);
    currentIndex = 0;
    if (currentPage() !== STEPS[0].page) {
      navigateToStep(STEPS[0]);
      return;
    }
    showCurrent();
  }

  function stop(completed) {
    clr(STORAGE_ACTIVE);
    clr(STORAGE_NAV);
    if (completed) set(STORAGE_DONE, '1');
    if (dom) {
      dom.overlay.classList.remove('active', 'has-spotlight', 'centered', 'navigating');
      dom.spotlight.removeAttribute('style');
      dom.tooltip.removeAttribute('style');
      dom.tooltip.classList.remove('bottom-sheet', 'centered-card', 'nav-card');
    }
    const launcher = document.querySelector('.tour-launcher');
    if (launcher && completed) launcher.style.display = 'none';
  }

  function goNext() {
    const step = STEPS[currentIndex];
    if (step && step.lastStep) { stop(true); return; }
    setStep(currentIndex + 1);
  }
  function goPrev() {
    if (currentIndex === 0) return;
    setStep(currentIndex - 1);
  }
  function setStep(i) {
    if (i < 0 || i >= TOTAL) return;
    currentIndex = i;
    set(STORAGE_STEP, String(i));
    const step = STEPS[i];
    if (currentPage() !== step.page) {
      navigateToStep(step);
      return;
    }
    showCurrent();
  }

  // ------- Cross-page navigation with smooth transition -------
  function navigateToStep(step) {
    ensureDom();
    set(STORAGE_NAV, '1');
    fillContent(step, /*navHint*/ true);
    dom.overlay.classList.add('active', 'centered', 'navigating');
    dom.tooltip.classList.add('centered-card', 'nav-card');
    dom.tooltip.classList.remove('bottom-sheet');
    dom.spotlight.style.display = 'none';
    // Brief delay so the user sees the "Going to X…" card before the page swaps
    setTimeout(() => { window.location.href = step.page; }, 550);
  }

  // ------- Show current step -------
  function showCurrent() {
    const step = STEPS[currentIndex];
    if (!step) { stop(true); return; }

    ensureDom();
    clr(STORAGE_NAV);
    dom.overlay.classList.add('active');
    dom.overlay.classList.remove('navigating');
    dom.tooltip.classList.remove('nav-card');

    fillContent(step);

    // Centered card mode: no spotlight, no specific target
    if (step.centered) {
      renderCenteredCard();
      return;
    }

    // Try to find the target; on mobile prefer bottom-sheet for noted steps
    findTarget(step).then(target => {
      const useSheet = isMobile() && (step.mobileSheet || !target);
      if (useSheet || !target) {
        renderBottomSheet();
        return;
      }
      scrollIntoViewSafe(target).then(() => renderSpotlight(step, target));
    });
  }

  function findTarget(step) {
    return new Promise(resolve => {
      let tries = 0;
      const max = 30;
      function tick() {
        const el = document.querySelector(step.target);
        if (el && isVisible(el)) return resolve(el);
        if (++tries >= max) return resolve(null);
        setTimeout(tick, 100);
      }
      tick();
    });
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    return true;
  }

  function scrollIntoViewSafe(target) {
    return new Promise(resolve => {
      const rect = target.getBoundingClientRect();
      const navOffset = 90; // approx fixed-navbar height
      const inView = rect.top >= navOffset && rect.bottom <= window.innerHeight - 60;
      if (inView) return resolve();
      // Scroll so target sits ~30% from the top, leaving room for tooltip below
      const targetY = rect.top + window.scrollY - (window.innerHeight * 0.3);
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      setTimeout(resolve, 500);
    });
  }

  // ------- Content -------
  function fillContent(step, navHint) {
    if (navHint) {
      dom.counter.textContent = 'GOING TO';
      dom.title.textContent   = step.pageLabel || step.title;
      dom.body.textContent    = step.title + ' — ' + step.body;
      dom.prev.style.display = 'none';
      dom.next.style.display = 'none';
      dom.skip.style.display = 'none';
      dom.progress.innerHTML = '';
      return;
    }

    // Restore action visibility
    dom.prev.style.display = '';
    dom.next.style.display = '';
    dom.skip.style.display = '';

    dom.counter.textContent = 'STEP ' + (currentIndex + 1) + ' OF ' + TOTAL +
                              (step.pageLabel ? ' · ' + step.pageLabel.toUpperCase() : '');
    dom.title.textContent = step.title;
    dom.body.textContent  = step.body;
    dom.progress.innerHTML = STEPS.map((_, i) =>
      '<span class="pip ' + (i <= currentIndex ? 'done' : '') + '"></span>'
    ).join('');
    dom.prev.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    dom.next.textContent = step.lastStep ? 'Finish' : 'Next';
  }

  // ------- Render modes -------
  function renderCenteredCard() {
    dom.overlay.classList.add('centered');
    dom.overlay.classList.remove('has-spotlight');
    dom.tooltip.classList.add('centered-card');
    dom.tooltip.classList.remove('bottom-sheet');
    dom.spotlight.style.display = 'none';
    dom.tooltip.removeAttribute('style');
  }

  function renderBottomSheet() {
    dom.overlay.classList.remove('has-spotlight', 'centered');
    dom.tooltip.classList.add('bottom-sheet');
    dom.tooltip.classList.remove('centered-card');
    dom.spotlight.style.display = 'none';
    dom.tooltip.removeAttribute('style');
  }

  function renderSpotlight(step, target) {
    dom.overlay.classList.add('has-spotlight');
    dom.overlay.classList.remove('centered');
    dom.tooltip.classList.remove('bottom-sheet', 'centered-card');
    dom.spotlight.style.display = 'block';

    const rect = target.getBoundingClientRect();
    const pad = 10;
    dom.spotlight.style.top    = (rect.top + window.scrollY - pad) + 'px';
    dom.spotlight.style.left   = (rect.left + window.scrollX - pad) + 'px';
    dom.spotlight.style.width  = (rect.width + pad * 2) + 'px';
    dom.spotlight.style.height = (rect.height + pad * 2) + 'px';

    // Position tooltip with smart placement (try requested side, else flip to side with most space)
    const vw = window.innerWidth, vh = window.innerHeight;
    const tipW = Math.min(360, vw - 32);
    dom.tooltip.style.width = tipW + 'px';
    const tipH = dom.tooltip.offsetHeight;
    const gap = 16;

    // Calculate space available on each side (in viewport coords)
    const space = {
      top:    rect.top - 80,
      bottom: vh - rect.bottom - 16,
      left:   rect.left - 16,
      right:  vw - rect.right - 16,
    };
    const need = {
      top:    tipH + gap,
      bottom: tipH + gap,
      left:   tipW + gap,
      right:  tipW + gap,
    };

    // Pick the requested placement if it fits; otherwise use the side with the most space
    let place = step.placement || 'bottom';
    if (space[place] < need[place]) {
      const ranked = Object.keys(space).sort((a, b) => (space[b] - need[b]) - (space[a] - need[a]));
      place = ranked[0];
    }

    let tipTop, tipLeft;
    if (place === 'right') {
      tipLeft = rect.right + window.scrollX + gap;
      tipTop  = rect.top + window.scrollY + (rect.height - tipH) / 2;
    } else if (place === 'left') {
      tipLeft = rect.left + window.scrollX - tipW - gap;
      tipTop  = rect.top + window.scrollY + (rect.height - tipH) / 2;
    } else if (place === 'top') {
      tipTop  = rect.top + window.scrollY - tipH - gap;
      tipLeft = rect.left + window.scrollX + (rect.width - tipW) / 2;
    } else { // bottom
      tipTop  = rect.bottom + window.scrollY + gap;
      tipLeft = rect.left + window.scrollX + (rect.width - tipW) / 2;
    }

    // Clamp inside viewport
    tipLeft = Math.max(window.scrollX + 16, Math.min(tipLeft, window.scrollX + vw - tipW - 16));
    tipTop  = Math.max(window.scrollY + 80, Math.min(tipTop, window.scrollY + vh - tipH - 16));

    dom.tooltip.style.top    = tipTop + 'px';
    dom.tooltip.style.left   = tipLeft + 'px';
    dom.tooltip.style.right  = 'auto';
    dom.tooltip.style.bottom = 'auto';
  }

  function renderCurrent() {
    const step = STEPS[currentIndex];
    if (!step || step.centered) return;
    const target = document.querySelector(step.target);
    if (isMobile() || !target || !isVisible(target)) {
      if (step.mobileSheet || !target) renderBottomSheet();
    } else {
      renderSpotlight(step, target);
    }
  }

  // ------- Resume on page load -------
  function resume() {
    if (!isActive()) return;
    const idx = parseInt(get(STORAGE_STEP) || '0', 10);
    currentIndex = isNaN(idx) ? 0 : Math.max(0, Math.min(idx, TOTAL - 1));
    const step = STEPS[currentIndex];
    if (!step) { stop(false); return; }

    // If we just navigated, show a brief "Welcome to [page]" pulse before settling
    const wasNavigating = get(STORAGE_NAV) === '1';
    clr(STORAGE_NAV);

    if (currentPage() === step.page) {
      ensureDom();
      if (wasNavigating) {
        // Carry the dark overlay through the page-load flash
        dom.overlay.classList.add('active');
      }
      // Wait a tick so dynamic content renders
      setTimeout(showCurrent, wasNavigating ? 250 : 200);
    }
  }

  // ------- Floating launcher -------
  function mountLauncher() {
    if (currentPage() !== 'index.html') return;
    if (document.querySelector('.tour-launcher')) return;
    const btn = document.createElement('button');
    btn.className = 'tour-launcher';
    btn.type = 'button';
    btn.innerHTML = '<span class="dot" aria-hidden="true"></span>Take the tour';
    btn.addEventListener('click', () => {
      set(STORAGE_PROMPT, '1');
      start();
    });
    if (get(STORAGE_DONE) === '1' && !isActive()) {
      btn.classList.add('subtle');
      btn.innerHTML = '<span class="dot" aria-hidden="true"></span>Re-take tour';
    }
    document.body.appendChild(btn);
  }

  // ------- Boot -------
  function boot() {
    mountLauncher();
    if (isActive()) {
      resume();
    } else if (
      currentPage() === 'index.html' &&
      get(STORAGE_DONE) !== '1' &&
      get(STORAGE_PROMPT) !== '1' &&
      !isMobile()
    ) {
      set(STORAGE_PROMPT, '1');
      // Auto-start opens the centered welcome card — non-disruptive
      setTimeout(start, 1200);
    }
  }

  // Public hooks (so user can window.LSCTour.start() from console for testing)
  window.LSCTour = { start, stop, resume, reset: () => {
    clr(STORAGE_ACTIVE); clr(STORAGE_STEP); clr(STORAGE_DONE); clr(STORAGE_PROMPT); clr(STORAGE_NAV);
    location.reload();
  }};

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
