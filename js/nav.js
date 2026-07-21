/**
 * nav.js — highlight the current page in the top nav.
 * Tiny, standalone, loaded on every page.
 */
(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();
