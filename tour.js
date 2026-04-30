// =============================================================================
// LSC Demo — Guided product tour (v2 — robust, mobile-first)
// Cross-page, localStorage-tracked.
// Mobile: bottom-sheet tooltip, no spotlight (reliable on tiny viewports).
// Desktop: spotlight + floating tooltip with smart placement + clamping.
// =============================================================================

(function () {
  'use strict';

  // ------- Constants -------
  const STORAGE_ACTIVE = 'lsc-tour-active';
  const STORAGE_STEP   = 'lsc-tour-step';
  const STORAGE_DONE   = 'lsc-tour-completed';
  const STORAGE_PROMPT = 'lsc-tour-prompted';
  const MOBILE_BREAK   = 768;

  // Each step: page, target selector, placement, copy.
  // Targets that are hidden on mobile gracefully fall back to bottom-sheet mode.
  const STEPS = [
    {
      page: 'index.html',
      target: '.hero',
      placement: 'right',
      title: 'Welcome to the new LSC',
      body: 'A 90-second guided tour of what\'s possible. Every section is a real, working demo of features Genesis will deliver — homepage, mobile app, watch, member portal, admin console.',
    },
    {
      page: 'index.html',
      target: '.hero-cards',
      mobileTarget: '.hero',  // fallback when hero-cards is hidden < 900px
      placement: 'left',
      title: 'Live activity, surfaced',
      body: 'On desktop, three live cards stream from the backend in real time — a court booking filling up, a featured event, a facility just opened. Members never miss what\'s happening at the club.',
    },
    {
      page: 'index.html',
      target: '.event-banner',
      placement: 'top',
      title: 'Cinematic event landing pages',
      body: 'Click into the STEM Robotics Workshop banner to see how a single LSC event becomes a full immersive landing page — animated traffic light, live countdown, spots-remaining counter, sticky reserve CTA. Every event you propose can look this good.',
    },
    {
      page: 'index.html',
      target: '.app-cta',
      placement: 'top',
      title: 'Phone + Watch experience',
      body: 'iOS, Android, Apple Watch and Wear OS — one connected ecosystem. Live heart rate streams to the app during a workout, members opt-in to share with their coach per session. QR membership card, family switcher, parking alerts.',
    },
    {
      page: 'programs.html',
      target: '[data-cat-section]',
      placement: 'top',
      title: '20+ programs, properly categorised',
      body: 'Sports grouped by category — Team, Racket, Aquatic, Fitness, Martial Arts, Individual, Mind & Strategy. Live capacity badges drive bookings ("3 spots left"). Tap any sport for the full program detail with coach card and schedule.',
    },
    {
      page: 'facilities.html',
      target: '.map-stage',
      placement: 'bottom',
      title: 'Interactive 3D club map',
      body: 'Hover any zone — Olympic pool, tennis courts, gym, cafe, STEM lab — for live availability and a one-click path to book in that facility. Same isometric look as the existing LSC site, but interactive.',
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
      mobileTarget: '.app-info',
      placement: 'left',
      title: 'Mobile app · 14 screens',
      body: 'Click any screen on the left list. Splash with auto check-in, home feed with parking, booking flow with waitlist, wallet card, family switcher, cafeteria pre-order, coach DM, progress dashboard, birthday party wizard, plus the new Connected Devices and Live Training screens.',
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
  let resizeRaf = 0;

  // ------- Storage helpers (try/catch for Safari private mode) -------
  function get(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch {} }

  function isActive()  { return get(STORAGE_ACTIVE) === '1'; }
  function isMobile()  { return window.innerWidth < MOBILE_BREAK; }
  function currentPage() {
    const p = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return p === '' ? 'index.html' : p;
  }

  // ------- DOM construction (one-time) -------
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

    window.addEventListener('resize', () => {
      if (!isActive()) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => renderCurrent());
    });

    window.addEventListener('scroll', () => {
      if (!isActive() || isMobile()) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => renderCurrent());
    }, { passive: true });

    return dom;
  }

  // ------- Public API -------
  function start() {
    set(STORAGE_ACTIVE, '1');
    set(STORAGE_STEP, '0');
    set(STORAGE_DONE, '');
    currentIndex = 0;
    if (currentPage() !== STEPS[0].page) {
      window.location.href = STEPS[0].page;
      return;
    }
    showCurrent();
  }

  function stop(completed) {
    set(STORAGE_ACTIVE, '');
    if (completed) set(STORAGE_DONE, '1');
    if (dom) {
      dom.overlay.classList.remove('active', 'has-spotlight');
      // Clean up positioning so it doesn't flash on next start
      dom.spotlight.removeAttribute('style');
      dom.tooltip.removeAttribute('style');
      dom.tooltip.classList.remove('bottom-sheet');
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
      // Briefly hide overlay before navigating to avoid a flash
      if (dom) dom.overlay.classList.remove('active');
      window.location.href = step.page;
      return;
    }
    showCurrent();
  }

  // ------- Showing a step -------
  // Tries to find the target (with retries for JS-rendered content).
  // Falls back to bottom-sheet mode on mobile or when target is hidden.
  function showCurrent() {
    const step = STEPS[currentIndex];
    if (!step) { stop(true); return; }

    ensureDom();
    fillContent(step);
    dom.overlay.classList.add('active');

    findTarget(step).then(target => {
      // Decide rendering mode
      if (isMobile() || !target || !isVisible(target)) {
        renderBottomSheet();
      } else {
        // Desktop: scroll into view, then position spotlight after settle
        scrollIntoViewSafe(target).then(() => renderSpotlight(step, target));
      }
    });
  }

  function findTarget(step) {
    // Try the regular target; on mobile prefer mobileTarget if set
    const sel = (isMobile() && step.mobileTarget) ? step.mobileTarget : step.target;
    return new Promise(resolve => {
      let tries = 0;
      const max = 30; // 3 seconds
      function tick() {
        const el = document.querySelector(sel);
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
    if (rect.width === 0 && rect.height === 0) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    return true;
  }

  function scrollIntoViewSafe(target) {
    return new Promise(resolve => {
      const rect = target.getBoundingClientRect();
      const inView = rect.top >= 80 && rect.bottom <= window.innerHeight - 60;
      if (inView) return resolve();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for smooth scroll to settle (Chrome/Safari ~400ms)
      setTimeout(resolve, 500);
    });
  }

  // ------- Content / progress -------
  function fillContent(step) {
    dom.counter.textContent = 'STEP ' + (currentIndex + 1) + ' OF ' + TOTAL;
    dom.title.textContent = step.title;
    dom.body.textContent = step.body;
    dom.progress.innerHTML = STEPS.map((_, i) =>
      '<span class="pip ' + (i <= currentIndex ? 'done' : '') + '"></span>'
    ).join('');
    dom.prev.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    dom.next.textContent = step.lastStep ? 'Finish' : 'Next';
  }

  // ------- Render modes -------
  function renderBottomSheet() {
    // Hide spotlight; pin tooltip as a bottom sheet, full-width.
    // Backdrop dim is visible (no spotlight to handle it).
    dom.overlay.classList.remove('has-spotlight');
    dom.spotlight.style.display = 'none';
    dom.tooltip.classList.add('bottom-sheet');
    // Reset any inline positioning that might linger from desktop mode
    dom.tooltip.style.top = '';
    dom.tooltip.style.left = '';
    dom.tooltip.style.width = '';
    dom.tooltip.style.maxWidth = '';
  }

  function renderSpotlight(step, target) {
    dom.tooltip.classList.remove('bottom-sheet');
    // Tell the overlay we're in spotlight mode so backdrop goes transparent
    dom.overlay.classList.add('has-spotlight');
    dom.spotlight.style.display = 'block';

    const rect = target.getBoundingClientRect();
    const pad = 12;
    const sTop = rect.top + window.scrollY - pad;
    const sLeft = rect.left + window.scrollX - pad;
    const sW = rect.width + pad * 2;
    const sH = rect.height + pad * 2;

    dom.spotlight.style.top    = sTop + 'px';
    dom.spotlight.style.left   = sLeft + 'px';
    dom.spotlight.style.width  = sW + 'px';
    dom.spotlight.style.height = sH + 'px';

    // Now position the tooltip; measure its actual height
    const tipW = Math.min(380, window.innerWidth - 32);
    dom.tooltip.style.width = tipW + 'px';
    // Force a measurement pass
    const tipH = dom.tooltip.offsetHeight;

    let tipTop, tipLeft;
    const place = step.placement || 'bottom';
    const gap = 16;

    // Initial placement
    if (place === 'right')      { tipTop = rect.top + window.scrollY; tipLeft = rect.right + window.scrollX + gap; }
    else if (place === 'left')  { tipTop = rect.top + window.scrollY; tipLeft = rect.left + window.scrollX - tipW - gap; }
    else if (place === 'top')   { tipTop = rect.top + window.scrollY - tipH - gap; tipLeft = rect.left + window.scrollX; }
    else                        { tipTop = rect.bottom + window.scrollY + gap; tipLeft = rect.left + window.scrollX; }

    // Auto-flip if it would overflow
    const vh = window.innerHeight, vw = window.innerWidth;
    const visTop  = tipTop - window.scrollY;
    const visLeft = tipLeft;
    if (place === 'right' && visLeft + tipW > vw - 16)        tipLeft = rect.left + window.scrollX - tipW - gap;
    if (place === 'left'  && visLeft < 16)                    tipLeft = rect.right + window.scrollX + gap;
    if (place === 'top'   && visTop < 80)                     tipTop = rect.bottom + window.scrollY + gap;
    if (place === 'bottom' && visTop + tipH > vh - 16)        tipTop = rect.top + window.scrollY - tipH - gap;

    // Final clamp inside viewport
    tipLeft = Math.max(16, Math.min(tipLeft, window.scrollX + vw - tipW - 16));
    tipTop  = Math.max(window.scrollY + 80, Math.min(tipTop, window.scrollY + vh - tipH - 16));

    dom.tooltip.style.top    = tipTop + 'px';
    dom.tooltip.style.left   = tipLeft + 'px';
    dom.tooltip.style.right  = 'auto';
    dom.tooltip.style.bottom = 'auto';
  }

  function renderCurrent() {
    // Re-render in response to scroll/resize without re-fetching the target
    const step = STEPS[currentIndex];
    if (!step) return;
    const sel = (isMobile() && step.mobileTarget) ? step.mobileTarget : step.target;
    const target = document.querySelector(sel);
    if (isMobile() || !target || !isVisible(target)) {
      renderBottomSheet();
    } else {
      renderSpotlight(step, target);
    }
  }

  // ------- Resume on cross-page navigation -------
  function resume() {
    if (!isActive()) return;
    const idx = parseInt(get(STORAGE_STEP) || '0', 10);
    currentIndex = isNaN(idx) ? 0 : Math.max(0, Math.min(idx, TOTAL - 1));
    const step = STEPS[currentIndex];
    if (!step) { stop(false); return; }
    if (currentPage() === step.page) {
      // Slight delay so the page has time to render its dynamic content
      setTimeout(showCurrent, 300);
    }
    // If we're on a different page, don't auto-show — user navigated away
  }

  // ------- Floating launcher pill on the homepage -------
  function mountLauncher() {
    if (currentPage() !== 'index.html') return;
    if (document.querySelector('.tour-launcher')) return;
    const btn = document.createElement('button');
    btn.className = 'tour-launcher';
    btn.type = 'button';
    btn.innerHTML = '<span class="dot" aria-hidden="true"></span>Take the tour';
    btn.addEventListener('click', () => {
      // Reset prompted flag so launcher acts as a manual start
      set(STORAGE_PROMPT, '1');
      start();
    });
    if (get(STORAGE_DONE) === '1' && !isActive()) {
      btn.classList.add('subtle'); // less attention-grabbing for repeat visitors
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
      !isMobile()  // don't auto-start on mobile — show launcher instead
    ) {
      set(STORAGE_PROMPT, '1');
      setTimeout(start, 1200);
    }
  }

  // Public hooks
  window.LSCTour = { start, stop, resume };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
