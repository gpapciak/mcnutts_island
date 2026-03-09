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

})();
