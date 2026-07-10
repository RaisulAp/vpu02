/* PT. Visi Prima Utama (VPU) — splash "ignition sequence"
   Shows once per browser session on first load, then never again until the
   tab/session ends (an inline script in <head> makes that decision before
   first paint — this file only runs the animation once we know it should).
   Paired with css/splash.css. */
(function () {
  "use strict";

  var splash = document.getElementById("splash-screen");
  if (!splash) return; // already removed by the early-exit inline script (repeat visit this session)

  try { sessionStorage.setItem("vpu-splash-seen", "1"); } catch (e) { /* private mode etc. — fail open */ }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ACTIVE_DURATION = reduceMotion ? 200 : 1800;
  var FADE_DURATION = reduceMotion ? 200 : 600;

  /* Trigger the ignition on the next paint so the browser commits the
     initial (grayscale, dormant) state before animating away from it. */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      splash.classList.add("is-active");
    });
  });

  /* ---- Subtle mouse-driven mesh parallax ---- */
  var mesh = splash.querySelector(".splash-mesh");
  if (mesh && !reduceMotion) {
    var ticking = false;
    var pendingEvent = null;
    var MAX_SHIFT = 14; // px, hard cap

    window.addEventListener(
      "mousemove",
      function (e) {
        pendingEvent = e;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var x = (pendingEvent.clientX / window.innerWidth - 0.5) * MAX_SHIFT * 2;
          var y = (pendingEvent.clientY / window.innerHeight - 0.5) * MAX_SHIFT * 2;
          mesh.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---- Fade out, hand control back to the page ---- */
  function hideSplash() {
    splash.classList.add("is-hiding");
    document.documentElement.classList.remove("splash-active");
    setTimeout(function () {
      splash.remove();
    }, FADE_DURATION);
  }

  setTimeout(hideSplash, ACTIVE_DURATION);
})();
