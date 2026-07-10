/* PT. Visi Prima Utama (VPU) — site interactions
   Header behavior, mobile nav, scroll reveals, counters, back-to-top. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Header scroll state + mobile nav ---- */
  var header = document.querySelector(".site-header");
  var navToggle = document.getElementById("nav-toggle");
  var backToTop = document.querySelector(".back-to-top");
  var THRESHOLD = 20;

  function updateHeader() {
    var menuOpen = navToggle && navToggle.checked;
    if (header) header.classList.toggle("is-scrolled", window.scrollY > THRESHOLD || menuOpen);
  }

  function updateActiveNav() {
    var sections = document.querySelectorAll("main section[id]");
    if (!sections.length) return;
    var navLinks = document.querySelectorAll('.nav a[href*="#"]');
    var current = null;
    var maxOffset = -Infinity;

    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= 160 && rect.top > maxOffset) {
        maxOffset = rect.top;
        current = section.id;
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove("active");
      var href = link.getAttribute("href") || "";
      if (current && href.indexOf("#" + current) !== -1) {
        link.classList.add("active");
      }
    });
  }

  function updateBackToTop() {
    if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > 640);
  }

  /* Batch all scroll-driven work into a single requestAnimationFrame tick
     instead of three independent listeners each forcing their own layout
     read — keeps desktop scrolling glassy instead of stuttering. */
  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      updateHeader();
      updateActiveNav();
      updateBackToTop();
      scrollTicking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  if (navToggle) navToggle.addEventListener("change", updateHeader);
  updateHeader();
  updateActiveNav();
  updateBackToTop();

  document.querySelectorAll(".nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (navToggle && navToggle.checked) {
        navToggle.checked = false;
        updateHeader();
      }
    });
  });

  document.addEventListener("click", function (e) {
    if (!navToggle || !navToggle.checked) return;
    if (e.target === navToggle) return;
    var insideNav = e.target.closest(".nav");
    var toggleLabel = e.target.closest(".nav-toggle-label");
    if (!insideNav && !toggleLabel) {
      navToggle.checked = false;
      updateHeader();
    }
  });

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---- Scroll reveal animations ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    var groupCounts = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var index = groupCounts.get(parent) || 0;
      el.style.setProperty("--stagger-i", (index % 6).toString());
      groupCounts.set(parent, index + 1);
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Animated counters for metric numbers ---- */
  var counters = document.querySelectorAll("[data-count-to]");

  function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    var duration = 1800;
    var startTime = null;

    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var value = target * easeOutQuint(progress);
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && counters.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---- Magnetic hover tilt (fine-pointer, motion-enabled only) ---- */
  var supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var MAX_TILT = 5; // degrees, hard cap

  function computeTilt(card, e) {
    var rect = card.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    var rotateY = (px * MAX_TILT * 2).toFixed(2);
    var rotateX = (-py * MAX_TILT * 2).toFixed(2);
    return "perspective(900px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-8px)";
  }

  if (supportsHover && !reduceMotion) {
    var magneticCards = document.querySelectorAll(
      ".metric-card, .info-card, .article-card, .hero-panel"
    );
    magneticCards.forEach(function (card) {
      var ticking = false;
      var pendingEvent = null;

      card.addEventListener("pointermove", function (e) {
        pendingEvent = e;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          card.style.transform = computeTilt(card, pendingEvent);
          ticking = false;
        });
      });

      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }
})();
