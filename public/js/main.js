/* McNutt's Island Alliance — Main Client JS */

(function () {
  'use strict';

  // ── Mobile nav toggle ────────────────────────────────────────────────────────
  const navToggle = document.getElementById('nav-toggle');
  const siteNav   = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('open', !expanded);
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-header')) {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('open');
      }
    });

    // Close nav on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('open');
      }
    });
  }

  // ── Flash message dismiss ─────────────────────────────────────────────────────
  document.querySelectorAll('.flash__dismiss').forEach((btn) => {
    btn.addEventListener('click', () => {
      const flash = btn.closest('.flash');
      if (flash) {
        flash.style.transition = 'opacity .2s ease, max-height .3s ease';
        flash.style.opacity = '0';
        flash.style.maxHeight = '0';
        flash.style.overflow = 'hidden';
        flash.style.padding = '0';
        flash.style.margin = '0';
        setTimeout(() => flash.remove(), 350);
      }
    });
  });

  // Auto-dismiss success flashes after 6 seconds
  document.querySelectorAll('.flash--success').forEach((flash) => {
    setTimeout(() => {
      if (flash.isConnected) {
        const dismiss = flash.querySelector('.flash__dismiss');
        if (dismiss) dismiss.click();
      }
    }, 6000);
  });

  // ── Character counts ─────────────────────────────────────────────────────────
  document.querySelectorAll('[data-maxlength]').forEach((field) => {
    const max = parseInt(field.getAttribute('data-maxlength'), 10);
    const countEl = document.getElementById(field.id + '-count');
    if (!countEl) return;

    function updateCount() {
      const remaining = max - field.value.length;
      countEl.textContent = remaining + ' characters remaining';
      countEl.className = 'char-count';
      if (remaining <= 20) countEl.classList.add('at-limit');
      else if (remaining <= max * 0.15) countEl.classList.add('near-limit');
    }

    field.addEventListener('input', updateCount);
    updateCount();
  });

  // ── Form submit state ─────────────────────────────────────────────────────────
  document.querySelectorAll('form[data-submitting]').forEach((form) => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = btn.getAttribute('data-loading') || 'Submitting…';
      }
    });
  });

  // ── Poll candidate selection highlight ───────────────────────────────────────
  document.querySelectorAll('.poll-candidate').forEach((card) => {
    const radio = card.querySelector('input[type="radio"]');
    if (!radio) return;

    card.addEventListener('click', () => {
      radio.checked = true;
      document.querySelectorAll('.poll-candidate').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });

    if (radio.checked) card.classList.add('selected');
  });

  // ── Animate results bars on load ─────────────────────────────────────────────
  const bars = document.querySelectorAll('.results-bar__fill[data-width]');
  if (bars.length) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        bars.forEach((bar) => {
          bar.style.width = bar.getAttribute('data-width') + '%';
        });
      }, 150);
    });
  }

  // ── Animations & micro-interactions ──────────────────────────────────────────

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Hero load-in stagger ─────────────────────────────────────────────────────
  (function initHeroLoad() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (reducedMotion) return;

    hero.classList.add('hero-loading');
    // Two rAF ticks: let CSS render opacity:0, then trigger transitions
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        hero.classList.add('hero-loaded');
      });
    });

    // CTA pulse on primary button — stop when hero scrolls out
    var ctaBtn = hero.querySelector('.hero__cta .btn--primary');
    if (ctaBtn) {
      ctaBtn.classList.add('cta-pulse');
      if ('IntersectionObserver' in window) {
        var heroObs = new IntersectionObserver(function(entries) {
          entries.forEach(function(e) {
            ctaBtn.classList.toggle('cta-pulse', e.isIntersecting);
          });
        }, { threshold: 0.1 });
        heroObs.observe(hero);
      }
    }
  }());

  // ─── Scroll reveal ────────────────────────────────────────────────────────────
  (function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (reducedMotion) return;

    // 1. Editorial sections — left/right slide
    document.querySelectorAll('.editorial').forEach(function(el) {
      var isReverse = el.classList.contains('editorial--reverse');
      var children = Array.from(el.children).filter(function(c) {
        return !c.classList.contains('img-placeholder') && c.tagName !== 'SCRIPT';
      });
      // First child: text (visually left on normal, right on reverse)
      if (children[0]) {
        children[0].classList.add('reveal', isReverse ? 'reveal--right' : 'reveal--left');
      }
      // Second child: image/illustration (visually right on normal, left on reverse)
      if (children[1]) {
        children[1].classList.add('reveal', isReverse ? 'reveal--left' : 'reveal--right');
        // Delay the image slightly
        children[1].style.transitionDelay = '80ms';
      }
    });

    // 2. Section headers
    document.querySelectorAll('.section__header, .section__header--center').forEach(function(el) {
      el.classList.add('reveal-header');
    });
    // Standalone eyebrow+h2 combos not inside .section__header
    document.querySelectorAll('.container--narrow > .section__eyebrow, .container > .section__eyebrow').forEach(function(eyebrow) {
      var parent = eyebrow.parentElement;
      if (!parent.classList.contains('section__header') && !parent.classList.contains('reveal-header')) {
        parent.classList.add('reveal-header');
      }
    });

    // 3. Card grids — stagger children
    document.querySelectorAll('.grid--auto-3, .grid--3, .grid--2, .grid--4').forEach(function(grid) {
      grid.classList.add('reveal-stagger');
      Array.from(grid.children).forEach(function(child, i) {
        child.style.transitionDelay = (i * 100) + 'ms';
      });
    });

    // 4. Member count-up
    var statNum = document.querySelector('.stat-callout__number');
    if (statNum) {
      var rawCount = parseInt(statNum.textContent.replace(/\D/g, ''), 10) || 0;
      statNum.dataset.countTarget = rawCount;
      statNum.dataset.countDone = '0';
    }

    // 5. SVG illustrations — line draw
    document.querySelectorAll('.svg-illustration').forEach(function(svg) {
      var pathEls = svg.querySelectorAll('path, line, polyline, ellipse, circle');
      var hasStrokes = false;
      var delay = 0;
      pathEls.forEach(function(el) {
        // Only animate elements that have a visible stroke
        var stroke = el.getAttribute('stroke') || el.style.stroke;
        if (!stroke || stroke === 'none') return;
        try {
          var len = Math.ceil(el.getTotalLength());
          el.style.strokeDasharray  = len;
          el.style.strokeDashoffset = len;
          el.style.setProperty('--draw-delay', (delay * 0.04) + 's');
          delay++;
          hasStrokes = true;
        } catch(err) { /* some elements may not support getTotalLength */ }
      });
      if (hasStrokes) svg.classList.add('svg-draw-ready');
    });

    // 6. Blockquotes
    document.querySelectorAll('blockquote').forEach(function(bq) {
      bq.classList.add('reveal', 'reveal-quote');
    });

    // ─── Unified Intersection Observer ──────────────────────────────────────────
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('visible');

        // Count-up for stat number
        if (el.classList.contains('stat-callout__number') && el.dataset.countTarget && el.dataset.countDone !== '1') {
          el.dataset.countDone = '1';
          animateCountUp(el, parseInt(el.dataset.countTarget, 10));
        }

        // SVG line draw: set dashoffset to 0 on all prepped children
        if (el.classList.contains('svg-draw-ready')) {
          el.querySelectorAll('path, line, polyline, ellipse, circle').forEach(function(p) {
            p.style.strokeDashoffset = '0';
          });
        }

        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    // Observe everything
    document.querySelectorAll(
      '.reveal, .reveal-stagger, .reveal-header, .svg-draw-ready, .stat-callout__number'
    ).forEach(function(el) { observer.observe(el); });

  }());

  // ─── Count-up animation ──────────────────────────────────────────────────────
  function animateCountUp(el, target) {
    if (reducedMotion) { el.textContent = target.toLocaleString(); return; }
    var duration = 1500;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var elapsed  = ts - start;
      var progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      var eased   = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ─── Page transition ─────────────────────────────────────────────────────────
  (function initPageTransitions() {
    if (reducedMotion) return;
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      // Skip: anchors, external, mailto, tel, new-tab, modifier keys
      if (!href || href.charAt(0) === '#' || href.indexOf('://') > -1 ||
          href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 ||
          link.target || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(function() { window.location.href = href; }, 210);
    });

    // Ensure page is fully visible on arrival (back/forward cache)
    window.addEventListener('pageshow', function(e) {
      if (e.persisted) document.body.classList.remove('page-leaving');
    });
  }());

  // ── Island Interactive Map ────────────────────────────────────────────────────
  (function initIslandMap() {
    const map    = document.getElementById('island-map');
    const panel  = document.getElementById('map-info-panel');
    const closeBtn = document.getElementById('map-panel-close');
    if (!map || !panel) return;

    const titleEl = document.getElementById('map-info-title');
    const descEl  = document.getElementById('map-info-desc');
    const linkEl  = document.getElementById('map-info-link');

    let activePoi = null;

    function openPanel(poi) {
      if (activePoi) activePoi.classList.remove('active');
      activePoi = poi;
      poi.classList.add('active');

      titleEl.textContent = poi.dataset.title  || '';
      descEl.innerHTML    = poi.dataset.desc   || '';
      linkEl.href         = poi.dataset.link   || '#';
      linkEl.textContent  = 'Learn more \u2192';

      panel.hidden = false;
      // Force reflow before adding active class for transition
      panel.getBoundingClientRect();
      panel.classList.add('active');
    }

    function closePanel() {
      panel.classList.remove('active');
      if (activePoi) { activePoi.classList.remove('active'); activePoi = null; }
      // Hide after transition
      panel.addEventListener('transitionend', function handler() {
        panel.hidden = true;
        panel.removeEventListener('transitionend', handler);
      }, { once: true });
    }

    // Click / tap on POI
    map.querySelectorAll('.map-poi').forEach(function(poi) {
      poi.addEventListener('click', function(e) {
        e.stopPropagation();
        if (poi === activePoi) { closePanel(); return; }
        openPanel(poi);
      });

      // Keyboard accessibility
      poi.setAttribute('tabindex', '0');
      poi.setAttribute('role', 'button');
      poi.setAttribute('aria-label', poi.dataset.title || 'Point of interest');
      poi.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          poi.click();
        }
      });
    });

    // Close button
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    // Click outside map closes panel
    document.addEventListener('click', function(e) {
      if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.map-poi')) {
        closePanel();
      }
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.classList.contains('active')) closePanel();
    });

    // Mobile bottom-sheet drag-to-dismiss
    var touchStartY = 0;
    panel.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchend', function(e) {
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (dy > 60) closePanel();
    }, { passive: true });
  }());

})();
