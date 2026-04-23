/* McNutt's Island Alliance — Main Client JS */

// The island doesn't need JavaScript. The island
// doesn't need anything from us, really. But here
// we are anyway, trying to be useful.

(function () {
  'use strict';

  // ── Footer year ───────────────────────────────────────────────────────────────
  var fy = document.getElementById('footer-year');
  if (fy) fy.textContent = new Date().getFullYear();

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
      if      (remaining <= 20)                                    countEl.classList.add('at-limit');
      else if (remaining <= Math.max(Math.floor(max * 0.15), 40)) countEl.classList.add('near-limit');
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

  // ── Animate results bars on load ─────────────────────────────────────────────
  const bars = document.querySelectorAll('.results-bar__fill[data-width]');
  if (bars.length) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        bars.forEach((bar) => {
          bar.style.transition = 'width 800ms cubic-bezier(0.23, 1, 0.32, 1)';
          bar.style.width = bar.getAttribute('data-width') + '%';
          setTimeout(() => { bar.classList.add('bar-animated'); }, 820);
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
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        hero.classList.add('hero-loaded');
      });
    });

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

    var statNum = document.querySelector('.stat-callout__number');
    if (statNum) {
      var rawCount = parseInt(statNum.textContent.replace(/\D/g, ''), 10) || 0;
      statNum.dataset.countTarget = rawCount;
      statNum.dataset.countDone = '0';
      if (reducedMotion) statNum.textContent = rawCount.toLocaleString();
    }

    if (reducedMotion) return;

    document.querySelectorAll('.editorial').forEach(function(el) {
      var isReverse = el.classList.contains('editorial--reverse');
      var children = Array.from(el.children).filter(function(c) {
        return !c.classList.contains('img-placeholder') && c.tagName !== 'SCRIPT';
      });
      if (children[0]) {
        children[0].classList.add('reveal', isReverse ? 'reveal--right' : 'reveal--left');
      }
      if (children[1]) {
        children[1].classList.add('reveal', isReverse ? 'reveal--left' : 'reveal--right');
        children[1].style.transitionDelay = '80ms';
      }
    });

    document.querySelectorAll('.section__header, .section__header--center').forEach(function(el) {
      el.classList.add('reveal-header');
    });
    document.querySelectorAll('.container--narrow > .section__eyebrow, .container > .section__eyebrow').forEach(function(eyebrow) {
      var parent = eyebrow.parentElement;
      if (!parent.classList.contains('section__header') && !parent.classList.contains('reveal-header')) {
        parent.classList.add('reveal-header');
      }
    });

    document.querySelectorAll('.grid--auto-3, .grid--3, .grid--2, .grid--4').forEach(function(grid) {
      grid.classList.add('reveal-stagger');
      Array.from(grid.children).forEach(function(child, i) {
        child.style.transitionDelay = (i * 100) + 'ms';
      });
    });

    var statNum = document.querySelector('.stat-callout__number');
    document.querySelectorAll('.svg-illustration').forEach(function(svg) {
      var pathEls = svg.querySelectorAll('path, line, polyline, ellipse, circle');
      var hasStrokes = false;
      var delay = 0;
      pathEls.forEach(function(el) {
        var stroke = el.getAttribute('stroke') || el.style.stroke;
        if (!stroke || stroke === 'none') return;
        try {
          var len = Math.ceil(el.getTotalLength());
          el.style.strokeDasharray  = len;
          el.style.strokeDashoffset = len;
          el.style.setProperty('--draw-delay', (delay * 0.04) + 's');
          delay++;
          hasStrokes = true;
        } catch(err) {}
      });
      if (hasStrokes) svg.classList.add('svg-draw-ready');
    });

    document.querySelectorAll('blockquote').forEach(function(bq) {
      bq.classList.add('reveal', 'reveal-quote');
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('visible');

        if (el.classList.contains('stat-callout__number') && el.dataset.countTarget && el.dataset.countDone !== '1') {
          el.dataset.countDone = '1';
          animateCountUp(el, parseInt(el.dataset.countTarget, 10));
        }

        if (el.classList.contains('svg-draw-ready')) {
          el.querySelectorAll('path, line, polyline, ellipse, circle').forEach(function(p) {
            p.style.strokeDashoffset = '0';
          });
        }

        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

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
      if (!href || href.charAt(0) === '#' || href.indexOf('://') > -1 ||
          href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 ||
          href.toLowerCase().indexOf('javascript:') === 0 ||
          link.target || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(function() { window.location.href = href; }, 210);
    });

    window.addEventListener('pageshow', function(e) {
      if (e.persisted) document.body.classList.remove('page-leaving');
    });
  }());

  // ── Naming page timeline ──────────────────────────────────────────────────────
  (function initNamingTimeline() {
    var entries = document.querySelectorAll('[data-timeline-entry]');
    if (!entries.length) return;
    if (!('IntersectionObserver' in window)) {
      entries.forEach(function(e) { e.classList.add('tl-visible'); });
      return;
    }
    if (reducedMotion) {
      entries.forEach(function(e) { e.classList.add('tl-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function(list) {
      list.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('tl-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });
    entries.forEach(function(e) { obs.observe(e); });
  }());

  // ── Story card expand / collapse ──────────────────────────────────────────────
  (function initStoryCards() {
    document.querySelectorAll('.story-card__expand-btn').forEach(function(btn) {
      var card    = btn.closest('.story-card');
      var excerpt = card ? card.querySelector('.story-card__excerpt') : null;
      var full    = card ? card.querySelector('.story-card__full')    : null;
      if (!excerpt || !full) return;

      btn.addEventListener('click', function() {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          full.hidden    = true;
          excerpt.hidden = false;
          btn.textContent = 'Read full story';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          excerpt.hidden = true;
          full.hidden    = false;
          btn.textContent = 'Show less';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }());

  // ── Seasonal calendar ─────────────────────────────────────────────────────────
  (function initSeasonCalendar() {
    var tabs   = document.querySelectorAll('.season-tab');
    var panels = document.querySelectorAll('.season-panel');
    if (!tabs.length || !panels.length) return;

    function activateSeason(season) {
      tabs.forEach(function(t) {
        var active = t.getAttribute('data-season') === season;
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(function(p) {
        p.hidden = p.getAttribute('data-season') !== season;
      });
    }

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        activateSeason(tab.getAttribute('data-season'));
      });
    });

    var month = new Date().getMonth() + 1;
    var current = month >= 4 && month <= 6  ? 'spring'
                : month >= 7 && month <= 8  ? 'summer'
                : month >= 9 && month <= 11 ? 'fall'
                :                             'winter';
    activateSeason(current);
  }());

  // ── Wildlife card expand / collapse ──────────────────────────────────────────
  (function initWildlifeCards() {
    document.querySelectorAll('.wildlife-card').forEach(function(card) {
      var body = card.querySelector('.card__expanded-body');

      function toggle(e) {
        if (e && e.target && e.target.closest('a')) return;
        var isExpanded = card.classList.contains('expanded');
        card.classList.toggle('expanded', !isExpanded);
        card.setAttribute('aria-expanded', String(!isExpanded));
        if (body) body.setAttribute('aria-hidden', String(isExpanded));
      }

      card.addEventListener('click', toggle);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(e);
        }
      });
    });
  }());

  // ── Habitat filter ────────────────────────────────────────────────────────────
  (function initHabitatFilter() {
    var filterBtns = document.querySelectorAll('.habitat-filter__btn');
    var cards      = document.querySelectorAll('.wildlife-card');
    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var habitat = btn.getAttribute('data-habitat');
        filterBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        cards.forEach(function(card) {
          var match = habitat === 'all' || card.getAttribute('data-habitat') === habitat;
          card.classList.toggle('habitat-hidden', !match);
          card.setAttribute('aria-hidden', String(!match));
        });
      });
    });
  }());

  // ── Leaflet Interactive Map ───────────────────────────────────────────────────
  (function initLeafletMaps() {
    var mapEls = document.querySelectorAll('[data-leaflet-map]');
    if (!mapEls.length) return;
    if (typeof L === 'undefined') return;

    // ── Editorial descriptions keyed by KMZ slug ─────────────────────────────
    var DESCRIPTIONS = {
      'lighthouse':                    'One of Canada\'s oldest lighthouses, guiding ships into Shelburne Harbour since 1788. The current octagonal wooden tower dates to 1833.',
      'wwii-barracks':                 'Concrete emplacements from Canada\'s coastal defence network, now being reclaimed by the forest. Armed with two six-inch naval guns during WWII.',
      'seal-rock':                     'Harbour seals haul out on exposed ledges, particularly in late summer and fall. Often visible from the lighthouse point.',
      'gunning-cove-marina':           'Public boat launch and departure point on the mainland. Approximately 4.5\u202fkm crossing to the island — about 20 minutes depending on weather, and 15 minutes from Shelburne town centre.',
      'hagars-cove':                   'The main arrival point for visitors crossing from Gunning Cove. The wharf provides sheltered landing in most conditions.',
      'roseway-beach':                 'A sweeping beach along the island\'s southern shore, with open-Atlantic views and excellent conditions for shore walking.',
      'black-loyalist-heritage-society': 'Connects the island\'s Black Loyalist heritage — one of the oldest and most significant Black settlements in Nova Scotia.',
      'grey-island':                   'A small island adjacent to McNutt\'s, offering additional wildlife habitat and sea-kayaking opportunities.',
      'salmon-fishery':                'Historic salmon fishery grounds that shaped the community\'s fishing traditions for generations.',
      'sandy-point-lighthouse':        'Marks the mainland entrance to Shelburne Harbour from the tip of Sandy Point.',
      'shelburne-waterfront':          'Shelburne\'s historic waterfront — a short drive to the Gunning Cove boat launch and the island crossing.',
      'the-islands-provincial-park':   'A provincial park protecting McNutt\'s Island and surrounding islands, preserving natural and cultural heritage.',
      'adaptation-island-project':     'A 200-acre experiment by one property owner in off-grid living, land stewardship, and new models of human relationship with a landscape under pressure. Visit <a href="https://adaptationisland.org" target="_blank" rel="noopener">adaptationisland.org</a>.',
      'eastern-way':                   'The deeper of the two passages into Shelburne Harbour. Because of the greater depth, most vessels enter and exit the harbour via the Eastern Way.',
      'western-way':                   'The shallower of the two passages into Shelburne Harbour, running between McNutt\'s Island and the western shore.',
      'lighthouse-rd':                 'The historical road to the lighthouse. 4.1\u202fkm one-way (8.2\u202fkm out and back) through Acadian forest. Stop at the gun barracks on the way out. Good for mountain bikes. Nice to loop back to the dock along the south shoreline.',
      'island-rd':                     'The main road traversing McNutt\'s Island, connecting communities and landmarks across its length.',
      'horseshoe-beach-road':          'A scenic route connecting beach access points and coastal viewpoints along the island\'s shoreline.',
      'main-boat-crossing-route':      'The primary boat crossing from Gunning Cove Marina on the mainland — approximately 4.5\u202fkm, taking about 20 minutes depending on weather.',
      'shortest-crossing':             'The shortest water route to McNutt\'s Island, practical in calm conditions.',
      'open-atlantic-ocean':           'The open Atlantic whose powerful swells and prevailing winds shape the island\'s ecology, weather, and way of life. From the southeast point of McNutt\'s Island, the view opens onto an almost planetary reach of water: beyond the near North Atlantic, the same uninterrupted sweep carries on through the South Atlantic between Brazil and West Africa, then into the Southern Ocean off East Antarctica, before meeting Australia roughly 20,000 kilometres away.',
      'shelburne-harbour-entrance':    'The entrance to Shelburne Harbour — one of the largest natural harbours on the eastern seaboard of North America.'
    };

    var LINKS = {
      'lighthouse':               'island.html#lighthouse',
      'wwii-barracks':            'island.html#battery',
      'seal-rock':                'flora-fauna.html#seals',
      'gunning-cove-marina':      'activities.html#getting-here',
      'hagars-cove':              'activities.html#getting-here',
      'main-boat-crossing-route': 'activities.html#getting-here',
      'shortest-crossing':        'activities.html#getting-here',
      'eastern-way':              'flora-fauna.html#bogs',
      'lighthouse-rd':            'activities.html#hiking',
      'the-islands-provincial-park': 'island.html'
    };

    // Display name overrides — used when the KMZ filename differs from preferred title
    var NAMES = {
      'lighthouse-rd':              'Lighthouse Trail',
      'shelburne-harbour-entrance': 'Shelburne Harbour Entrance',
      'adaptation-island-project':  'Adaptation Island Project'
    };

    // Polygon slugs rendered as permanent clickable text labels instead of click-on-shape
    var LABEL_SLUGS = {
      'western-way':                'Western Way',
      'eastern-way':                'Eastern Way',
      'shelburne-harbour-entrance': 'Shelburne Harbour',
      'open-atlantic-ocean':        'Open Atlantic Ocean'
    };

    // Manual label positions [lat, lng] — override computed centroid where needed
    var LABEL_POSITIONS = {
      'western-way':          [43.625, -65.322],
      'eastern-way':          [43.652, -65.258],
      'open-atlantic-ocean':  [43.608, -65.224]
    };

    // Polygon slugs that get a small calligraphy label rendered directly on the polygon
    var CALLIGRAPHY_SLUGS = {
      'adaptation-island-project': 'Adaptation Island'
    };

    // Per-slug polygon style overrides — used instead of gjStyle() defaults
    var POLYGON_STYLE_OVERRIDES = {
      'adaptation-island-project': { color: '#ffffff', weight: 2.5, opacity: 0.8, fillColor: '#ffffff', fillOpacity: 0.08 }
    };

    // Slugs that represent mainland / off-island locations (amber icon)
    var MAINLAND_SLUGS = {
      'gunning-cove-marina': true,
      'black-loyalist-heritage-society': true,
      'sandy-point-lighthouse': true,
      'shelburne-waterfront': true
    };

    var lighthouseIcon = L.divIcon({
      className:   'island-marker',
      html:        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#f5f1e8" stroke="#3a3a3a" stroke-width="1.5"/><path d="M10 7 L10 17 L14 17 L14 7 Z M9 7 L15 7 L14 5 L10 5 Z M11 9 L13 9 M11 11 L13 11 M11 13 L13 13" fill="none" stroke="#3a3a3a" stroke-width="1" stroke-linecap="round"/></svg>',
      iconSize:    [28, 28],
      iconAnchor:  [14, 14],
      popupAnchor: [0, -16]
    });

    var dotIcon = L.divIcon({
      className:   'island-marker',
      html:        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="#c8553d" stroke="#f5f1e8" stroke-width="2"/></svg>',
      iconSize:    [28, 28],
      iconAnchor:  [14, 14],
      popupAnchor: [0, -8]
    });

    var townIcon = L.divIcon({
      className:   'island-marker',
      html:        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="7" fill="#f5f1e8" stroke="#3a3a3a" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="#3a3a3a"/></svg>',
      iconSize:    [28, 28],
      iconAnchor:  [14, 14],
      popupAnchor: [0, -16]
    });

    var LIGHTHOUSE_SLUGS = { 'lighthouse': true, 'sandy-point-lighthouse': true };

    var TOOLTIP_DIRS = {
      'lighthouse':                      'right',
      'wwii-barracks':                   'right',
      'seal-rock':                       'right',
      'gunning-cove-marina':             'bottom',
      'hagars-cove':                     'right',
      'roseway-beach':                   'bottom',
      'black-loyalist-heritage-society': 'right',
      'grey-island':                     'bottom',
      'salmon-fishery':                  'left',
      'sandy-point-lighthouse':          'left',
      'shelburne-waterfront':            'top',
      'the-islands-provincial-park':     'right',
      'adaptation-island-project':       'right'
    };

    function makeKmzPointIcon(slug) {
      if (LIGHTHOUSE_SLUGS[slug]) return lighthouseIcon;
      if (MAINLAND_SLUGS[slug]) return townIcon;
      return dotIcon;
    }

    function makeKmzPopup(name, slug, desc, link) {
      var imgPath = 'images/places/' + slug + '.jpg';
      var html = '<div class="map-popup">';
      html += '<div class="map-popup__img-wrap">' +
              '<img class="map-popup__img" src="' + imgPath + '" alt="" ' +
              'onerror="this.parentNode.style.display=\'none\'">' +
              '</div>';
      html += '<p class="map-popup__title">' + name + '</p>';
      if (desc) html += '<p class="map-popup__desc">' + desc + '</p>';
      if (link) html += '<a class="map-popup__link" href="' + link + '">Learn more \u2192</a>';
      html += '</div>';
      return html;
    }

    function polygonCentroid(gj) {
      var coords = [];
      gj.features.forEach(function(f) {
        if (!f.geometry) return;
        var geom = f.geometry;
        var rings = geom.type === 'Polygon'      ? [geom.coordinates[0]] :
                    geom.type === 'MultiPolygon' ? geom.coordinates.map(function(p) { return p[0]; }) : [];
        rings.forEach(function(ring) { ring.forEach(function(c) { coords.push(c); }); });
      });
      if (!coords.length) return null;
      return [
        coords.reduce(function(s, c) { return s + c[1]; }, 0) / coords.length,
        coords.reduce(function(s, c) { return s + c[0]; }, 0) / coords.length
      ];
    }

    function makePlaceLabelIcon(text) {
      return L.divIcon({
        html: '<div class="map-place-label">' + text + '</div>',
        className: 'map-place-label-wrap',
        iconSize:   [0, 0],
        iconAnchor: [0, 0]
      });
    }

    function makeCalligraphyIcon(text, extraClass) {
      var cls = 'map-calligraphy-label' + (extraClass ? ' ' + extraClass : '');
      return L.divIcon({
        html: '<div class="' + cls + '">' + text + '</div>',
        className: 'map-calligraphy-label-wrap',
        iconSize:   [0, 0],
        iconAnchor: [0, 0]
      });
    }

    mapEls.forEach(function(el) {
      var map = L.map(el, {
        center: [43.633986, -65.284784],
        zoom: 13,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: [[43.50, -65.55], [43.78, -64.95]],
        maxBoundsViscosity: 0.85
      });

      var satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
          maxZoom: 18
        }
      );
      var topoLayer = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
          maxZoom: 17
        }
      );
      satLayer.addTo(map);

      var currentLayer = 'satellite';
      var wrapper = el.closest('.leaflet-map-wrapper');
      var toggle  = wrapper ? wrapper.querySelector('.map-tile-toggle') : null;
      if (toggle) {
        toggle.querySelectorAll('.tile-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var layer = btn.getAttribute('data-layer');
            if (layer === currentLayer) return;
            currentLayer = layer;
            toggle.querySelectorAll('.tile-btn').forEach(function(b) {
              b.classList.toggle('tile-btn--active', b === btn);
            });
            if (layer === 'satellite') {
              map.removeLayer(topoLayer);
              satLayer.addTo(map);
            } else {
              map.removeLayer(satLayer);
              topoLayer.addTo(map);
            }
          });
        });
      }

      // Island name — permanent label in open northeast area
      L.marker([43.645, -65.280], {
        icon:         makeCalligraphyIcon('McNutt\u2019s Island', 'map-calligraphy-label--island'),
        zIndexOffset: 50,
        interactive:  false
      }).addTo(map);

      // ── Load GeoJSON layers from converted KMZ files ────────────────────────
      function gjStyle(feature, layerName) {
        var type = feature.geometry && feature.geometry.type || '';
        var n    = layerName.toLowerCase();
        // Crossing / boat route lines — dashed teal
        if (n.includes('crossing') || n.includes('route')) {
          return { color: '#2A6B7C', weight: 2.5, dashArray: '7 5', opacity: 0.75 };
        }
        // Road / path lines on island — solid amber
        if (type === 'LineString' || type === 'MultiLineString') {
          return { color: '#C49A6C', weight: 2.2, opacity: 0.85 };
        }
        // Polygons — very subtle teal outline + fill
        return { color: '#2A6B7C', weight: 1.5, opacity: 0.45, fillColor: '#2A6B7C', fillOpacity: 0.05 };
      }

      fetch('geojson/manifest.json')
        .then(function(r) { return r.json(); })
        .then(function(manifest) {
          manifest.forEach(function(entry) {
            fetch('geojson/' + entry.slug + '.geojson')
              .then(function(r) { return r.json(); })
              .then(function(gj) {
                // Detect line-only layers so we can add a wide hit area
                var isLineLayer = entry.types.length > 0 && entry.types.every(function(t) {
                  return t === 'LineString' || t === 'MultiLineString';
                });

                function bindLayerPopup(feature, layer) {
                  var props = feature.properties || {};
                  var name  = NAMES[entry.slug] || props.name || entry.name;
                  layer.bindPopup(
                    makeKmzPopup(name, entry.slug, DESCRIPTIONS[entry.slug] || '', LINKS[entry.slug] || ''),
                    { maxWidth: 260, className: 'mcnutts-popup' }
                  );
                }

                var isLabelLayer = !!LABEL_SLUGS[entry.slug];

                // Visual layer — skipped entirely for label polygons
                if (!isLabelLayer) {
                  L.geoJSON(gj, {
                    style:        function(feature) { return POLYGON_STYLE_OVERRIDES[entry.slug] || gjStyle(feature, entry.name); },
                    interactive:  !isLineLayer,
                    pointToLayer: function(feature, latlng) {
                      var props = feature.properties || {};
                      var name  = NAMES[entry.slug] || props.name || entry.name;
                      var m = L.marker(latlng, {
                        icon: makeKmzPointIcon(entry.slug)
                      });
                      m.bindTooltip(name, {
                        permanent:  true,
                        direction:  TOOLTIP_DIRS[entry.slug] || 'right',
                        offset:     [10, 0],
                        className:  'island-label'
                      });
                      return m;
                    },
                    onEachFeature: isLineLayer ? undefined : bindLayerPopup
                  }).addTo(map);
                }

                // Hit-detection layer for lines — wide invisible stroke, interactive only
                if (isLineLayer) {
                  L.geoJSON(gj, {
                    style:         function() { return { weight: 18, opacity: 0, fillOpacity: 0 }; },
                    onEachFeature: bindLayerPopup
                  }).addTo(map);
                }

                // Permanent clickable text label at polygon centroid (or manual position)
                if (isLabelLayer) {
                  var centroid = LABEL_POSITIONS[entry.slug] || polygonCentroid(gj);
                  if (centroid) {
                    var labelText  = LABEL_SLUGS[entry.slug];
                    var popupTitle = NAMES[entry.slug] || labelText;
                    var desc = DESCRIPTIONS[entry.slug] || '';
                    var link = LINKS[entry.slug] || '';
                    var labelMarker = L.marker(centroid, {
                      icon: makePlaceLabelIcon(labelText),
                      zIndexOffset: 200
                    });
                    labelMarker.bindPopup(
                      makeKmzPopup(popupTitle, entry.slug, desc, link),
                      { maxWidth: 260, className: 'mcnutts-popup' }
                    );
                    labelMarker.addTo(map);
                  }
                }

                // Non-interactive calligraphy label rendered directly on the polygon
                if (CALLIGRAPHY_SLUGS[entry.slug]) {
                  var calCentroid = LABEL_POSITIONS[entry.slug] || polygonCentroid(gj);
                  if (calCentroid) {
                    L.marker(calCentroid, {
                      icon:         makeCalligraphyIcon(CALLIGRAPHY_SLUGS[entry.slug]),
                      zIndexOffset: 100,
                      interactive:  false
                    }).addTo(map);
                  }
                }
              })
              .catch(function(err) { console.warn('GeoJSON fetch failed:', entry.slug, err); });
          });
        })
        .catch(function(err) { console.warn('GeoJSON manifest fetch failed:', err); });

      // Keep map sized correctly if container resizes
      if (window.ResizeObserver) {
        new ResizeObserver(function() { map.invalidateSize(); }).observe(el);
      }
    });
  }());

  // ── Conditions widget ─────────────────────────────────────────────────────
  (function initConditionsWidget() {
    var widgets = document.querySelectorAll('[data-conditions-widget]');
    if (!widgets.length) return;

    var DATA = [
      { name: 'January',   water: '1\u20133\u00b0C',   daylight: '~9 h',     wind: 'Frequent storms',     difficulty: 'Challenging' },
      { name: 'February',  water: '0\u20132\u00b0C',   daylight: '~10 h',    wind: 'Ice possible',        difficulty: 'Challenging' },
      { name: 'March',     water: '1\u20133\u00b0C',   daylight: '~12 h',    wind: 'Variable',            difficulty: 'Challenging' },
      { name: 'April',     water: '3\u20136\u00b0C',   daylight: '~13.5 h',  wind: 'Improving',           difficulty: 'Moderate'    },
      { name: 'May',       water: '6\u201310\u00b0C',  daylight: '~15 h',    wind: 'Generally calm',      difficulty: 'Easy'        },
      { name: 'June',      water: '10\u201314\u00b0C', daylight: '~16 h',    wind: 'Fog possible',        difficulty: 'Easy'        },
      { name: 'July',      water: '14\u201318\u00b0C', daylight: '~16 h',    wind: 'Warmest and calmest', difficulty: 'Easy'        },
      { name: 'August',    water: '16\u201319\u00b0C', daylight: '~15 h',    wind: 'Warm',                difficulty: 'Easy'        },
      { name: 'September', water: '14\u201317\u00b0C', daylight: '~13 h',    wind: 'Hurricane season',    difficulty: 'Moderate'    },
      { name: 'October',   water: '10\u201314\u00b0C', daylight: '~11.5 h',  wind: 'Storms increasing',   difficulty: 'Moderate'    },
      { name: 'November',  water: '6\u201310\u00b0C',  daylight: '~10 h',    wind: 'Rough seas',          difficulty: 'Challenging' },
      { name: 'December',  water: '3\u20136\u00b0C',   daylight: '~9 h',     wind: 'Winter storms',       difficulty: 'Challenging' },
    ];

    var d = DATA[new Date().getMonth()];
    var slug = d.difficulty.toLowerCase();

    var html =
      '<div class="conditions-widget__header">' +
        '<span class="conditions-widget__eyebrow">Typical Conditions</span>' +
        '<span class="conditions-widget__month">' + d.name + '</span>' +
        '<span class="conditions-widget__difficulty conditions-widget__difficulty--' + slug + '" aria-label="Difficulty: ' + d.difficulty + '">' + d.difficulty + '</span>' +
      '</div>' +
      '<dl class="conditions-widget__data">' +
        '<div class="conditions-widget__row"><dt>Water temp</dt><dd>' + d.water + '</dd></div>' +
        '<div class="conditions-widget__row"><dt>Daylight</dt><dd>' + d.daylight + '</dd></div>' +
        '<div class="conditions-widget__row"><dt>Wind / sea</dt><dd>' + d.wind + '</dd></div>' +
      '</dl>' +
      '<p class="conditions-widget__note">' +
        'Conditions vary. Always check the ' +
        '<a href="https://weather.gc.ca/marine/index_e.html" target="_blank" rel="noopener noreferrer">marine forecast</a>' +
        ' before crossing.' +
      '</p>';

    widgets.forEach(function(w) { w.innerHTML = html; });
  }());


})();
