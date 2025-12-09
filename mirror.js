(function() {
  const params = new URLSearchParams(window.location.search);
  const ciActivationPath = '/ci.html';

  if (params.has('ci.cherev') || window.location.pathname.includes('/ci')) {
    window.location.replace(ciActivationPath);
  }
})();
