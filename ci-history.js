(function () {
  // 1) Decode ci_seed from URL (if present) and send to the SW
  function parseSeedFromURL() {
    try {
      const url = new URL(window.location.href);
      const seedParam = url.searchParams.get("ci_seed");
      if (!seedParam) return null;

      const json = atob(seedParam);
      const data = JSON.parse(json);
      if (typeof data !== "object" || !data) return null;
      return data;
    } catch (e) {
      console.warn("CI Mirror: unable to parse ci_seed", e);
      return null;
    }
  }

  function sendSeedToServiceWorker(seedData) {
    if (!("serviceWorker" in navigator)) return;
    if (!seedData) return;

    navigator.serviceWorker.ready
      .then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: "CI_SEED",
            payload: seedData
          });
        }
      })
      .catch((err) => {
        console.warn("CI Mirror: unable to send seed to SW", err);
      });
  }

  // 2) Handle PWA install prompt: capture + auto-prompt on first gesture
  let deferredInstallPrompt = null;
  let installAlreadyRequested = false;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Prevent the default mini-infobar from showing
    event.preventDefault();
    deferredInstallPrompt = event;
    // We do NOT prompt immediately to avoid violating gesture rules;
    // we will prompt on the very first tap / keypress.
    console.log("CI Mirror: beforeinstallprompt captured.");
  });

  function tryTriggerInstallPrompt() {
    if (!deferredInstallPrompt || installAlreadyRequested) return;

    installAlreadyRequested = true;

    deferredInstallPrompt
      .prompt()
      .then(() => {
        // User sees the system-level install dialog.
        deferredInstallPrompt = null;
      })
      .catch((err) => {
        console.warn("CI Mirror: install prompt failed or was dismissed", err);
      });
  }

  function wireFirstUserGesture() {
    if (typeof document === "undefined") return;

    const gestureHandler = () => {
      document.removeEventListener("click", gestureHandler, true);
      document.removeEventListener("keydown", gestureHandler, true);
      tryTriggerInstallPrompt();
    };

    document.addEventListener("click", gestureHandler, true);
    document.addEventListener("keydown", gestureHandler, true);
  }

  // 3) On load: parse seed + wire everything
  window.addEventListener("load", () => {
    const seed = parseSeedFromURL();
    if (seed) {
      sendSeedToServiceWorker(seed);
    }
    wireFirstUserGesture();
  });
})();
