// Hero particle background — dark mode only. Ported 1:1 from
// FE/src/components/sections/HeroParticleField.tsx (drift + breathing pulse
// + pointer-reactive parallax + connecting lines), scoped to the .hero
// section only (sized to its parent, not the viewport). Colors match the
// dark-mode amethyst/indigo accent tokens in css/style.css (html.dark).
(function () {
  var DOT_COLORS = ['168,85,247', '99,102,241', '192,132,252'];
  var LINE_COLOR = '168,85,247';
  var POINTER_LINE_COLOR = '192,132,252';
  var CONNECT_DIST = 130;
  var POINTER_CONNECT_DIST = 190;
  var POINTER_FORCE_RADIUS = 190;

  var canvas, ctx, container;
  var particles = [];
  var raf = 0;
  var running = false;
  var listenersAttached = false;
  var width = 0, height = 0, dpr = 1;
  var pointer = { x: null, y: null };
  var resizeObserver = null;

  function seed() {
    var count = Math.max(28, Math.min(110, Math.round((width * height) / 8500)));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        phase: Math.random() * Math.PI * 2,
        speed: 1.4 + Math.random() * 1.3,
        color: DOT_COLORS[i % DOT_COLORS.length],
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      if (pointer.x !== null && pointer.y !== null) {
        var dxm = p.x - pointer.x;
        var dym = p.y - pointer.y;
        var distm = Math.sqrt(dxm * dxm + dym * dym);
        if (distm < POINTER_FORCE_RADIUS && distm > 0.01) {
          var force = (1 - distm / POINTER_FORCE_RADIUS) * 1.4;
          p.x += (dxm / distm) * force;
          p.y += (dym / distm) * force;
        }
      }
    });

    ctx.lineWidth = 1;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i], b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          var alpha = (1 - dist / CONNECT_DIST) * 0.28;
          ctx.strokeStyle = 'rgba(' + LINE_COLOR + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (pointer.x !== null && pointer.y !== null) {
      var px = pointer.x, py = pointer.y;
      particles.forEach(function (p) {
        var dxp = p.x - px, dyp = p.y - py;
        var distp = Math.sqrt(dxp * dxp + dyp * dyp);
        if (distp < POINTER_CONNECT_DIST) {
          var alphaP = (1 - distp / POINTER_CONNECT_DIST) * 0.45;
          ctx.strokeStyle = 'rgba(' + POINTER_LINE_COLOR + ',' + alphaP.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      });
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + POINTER_LINE_COLOR + ',.9)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(' + POINTER_LINE_COLOR + ',.8)';
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    particles.forEach(function (p) {
      var pulse = 0.35 + 0.35 * Math.sin(time * 0.0018 * p.speed + p.phase);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.color + ',' + pulse.toFixed(3) + ')';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(' + p.color + ',' + (pulse * 0.7).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (running) raf = requestAnimationFrame(draw);
  }

  function handlePointerMove(clientX, clientY) {
    var rect = container.getBoundingClientRect();
    var within = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    if (!within) {
      pointer.x = null;
      pointer.y = null;
      return;
    }
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
  }

  function onMouseMove(e) { handlePointerMove(e.clientX, e.clientY); }
  function onMouseLeave() { pointer.x = null; pointer.y = null; }
  function onTouchMove(e) {
    var t = e.touches[0];
    if (t) handlePointerMove(t.clientX, t.clientY);
  }

  function start() {
    if (running) return;
    if (!canvas) canvas = document.querySelector('.hero-particle-field');
    if (!canvas) return;
    container = canvas.parentElement;
    if (!container) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    running = true;
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    raf = requestAnimationFrame(draw);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    listenersAttached = true;
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (listenersAttached) {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      listenersAttached = false;
    }
    if (ctx && width && height) ctx.clearRect(0, 0, width, height);
  }

  function sync() {
    if (document.documentElement.classList.contains('dark')) start();
    else stop();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.hero-particle-field')) return;
    sync();
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        setTimeout(sync, 0);
      });
    }
  });
})();
