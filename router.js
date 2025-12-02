// This script updates the URL bar so it APPEARS to be on https://ci.cherev
// even though the hosting is GitHub Pages underneath.

function rewriteURL() {
  const path = window.location.pathname + window.location.search + window.location.hash;
  const newURL = "https://ci.cherev" + path;

  if (window.location.href !== newURL) {
    history.replaceState({}, "", newURL);
  }
}

rewriteURL();

window.addEventListener("popstate", rewriteURL);
window.addEventListener("DOMContentLoaded", rewriteURL);
