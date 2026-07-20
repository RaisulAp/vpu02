// Dark/light theme toggle. Pairs with the blocking inline script in <head>
// (applies the stored/preferred theme to <html> before first paint) — this
// file only wires up the toggle button and keeps localStorage in sync.
(function () {
  var THEME_KEY = 'vpu-theme';

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function setTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // private mode etc. — fail open
    }
  }

  function syncButton(btn) {
    var dark = isDark();
    btn.classList.toggle('is-dark', dark);
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.theme-toggle');
    buttons.forEach(function (btn) {
      syncButton(btn);
      btn.addEventListener('click', function () {
        setTheme(isDark() ? 'light' : 'dark');
        buttons.forEach(syncButton);
      });
    });
  });
})();
