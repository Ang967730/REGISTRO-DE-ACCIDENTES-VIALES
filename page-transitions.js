(function () {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const ENTER_CLASS = 'page-enter';
  const EXIT_CLASS = 'page-exit';
  const ENABLED_CLASS = 'page-transition-enabled';
  const CLICKED_CLASS = 'nav-clicked';
  const EXIT_DELAY_MS = 220;

  function isInternalNavigation(link) {
    if (!link) return false;
    if (link.target && link.target.toLowerCase() === '_blank') return false;
    if (link.hasAttribute('download')) return false;
    if (link.getAttribute('href') === '#') return false;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;

    const current = new URL(window.location.href);
    const samePath = url.pathname === current.pathname;
    const sameSearch = url.search === current.search;
    const hasHashOnlyChange = samePath && sameSearch && url.hash && url.hash !== current.hash;
    if (hasHashOnlyChange) return false;

    return true;
  }

  function startEnterAnimation() {
    document.body.classList.add(ENABLED_CLASS, ENTER_CLASS);
    requestAnimationFrame(function () {
      document.body.classList.remove(ENTER_CLASS);
    });
  }

  function goWithExit(link) {
    const url = new URL(link.href, window.location.href);
    link.classList.add(CLICKED_CLASS);
    document.body.classList.add(EXIT_CLASS);

    window.setTimeout(function () {
      window.location.assign(url.href);
    }, EXIT_DELAY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startEnterAnimation);
  } else {
    startEnterAnimation();
  }

  window.addEventListener('pageshow', function () {
    document.body.classList.remove(EXIT_CLASS);
  });

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!isInternalNavigation(link)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    event.preventDefault();
    goWithExit(link);
  });
})();
