// CI mirror redirect for Table_Well and ci.cherev
// - If the URL has ?ci.cherev or the path already contains /ci
//   we send the visitor to the CI activation page.
// - Works on both:
//     https://lifeabundantly.github.io/Table_Well/
//   and
//     https://ci.cherev/

(function () {
  try {
    var params = new URLSearchParams(window.location.search);

    // Only do anything when the CI mirror key is present
    // or we are already on a /ci path.
    if (!params.has('ci.cherev') && !window.location.pathname.includes('/ci')) {
      return;
    }

    var path = window.location.pathname || '/';
    var base = '';

    // On GitHub project pages the path starts with /Table_Well/
    if (path.indexOf('/Table_Well/') === 0) {
      base = '/Table_Well';
    }

    // On the custom domain (ci.cherev) the base stays ''.
    window.location.replace(base + '/ci.html');
  } catch (e) {
    // Fail soft; never break the main page.
    console.error('CI mirror redirect error', e);
  }
})();
