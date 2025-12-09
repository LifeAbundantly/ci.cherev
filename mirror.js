(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('ci.cherev') || window.location.pathname.includes('/ci')) {
    window.location.replace('/Table_Well/ci.html');
  }
})();
