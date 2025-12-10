// gate.js — The Table Gate
// First engagement into CI.CHEREV on this device.
(function () {
  let deferredPWAInstallEvent = null;

  // Capture the browser's install prompt event so we can
  // trigger it right after "Have a Seat" when available.
  window.addEventListener("beforeinstallprompt", function (e) {
    try {
      e.preventDefault();
      deferredPWAInstallEvent = e;
    } catch (err) {
      console.error("CI.CHEREV gate: beforeinstallprompt error", err);
    }
  });

  function markJoined() {
    try {
      localStorage.setItem("ci_cherev_joined", "1");
    } catch (e) {
      // Storage might be disabled; fail silently.
    }
  }

  function alreadyJoined() {
    try {
      return localStorage.getItem("ci_cherev_joined") === "1";
    } catch (e) {
      return false;
    }
  }

  async function tryTriggerPWAInstall() {
    if (!deferredPWAInstallEvent) return;
    const promptEvent = deferredPWAInstallEvent;
    deferredPWAInstallEvent = null;
    try {
      await promptEvent.prompt();
      // We could inspect promptEvent.userChoice here if we wanted.
    } catch (e) {
      console.warn("CI.CHEREV gate: PWA install prompt failed", e);
    }
  }

  function openGateIfNeeded() {
    var gate = document.getElementById("table-gate");
    var btn = document.getElementById("table-gate-enter");
    if (!gate || !btn) return;

    // If the device has already "sat at the Table", don't show the gate again.
    if (alreadyJoined()) {
      gate.classList.add("hidden");
      return;
    }

    gate.classList.remove("hidden");

    btn.addEventListener("click", async function () {
      // Mark device as part of CI.CHEREV
      markJoined();

      // Hide gate visually
      gate.classList.add("hidden");

      // Light-touch synthetic engagement marker for CI:
      // this is a single "I sat here" seed that SW or future logic can read.
      try {
        localStorage.setItem("ci_cherev_seed", Date.now().toString());
      } catch (e) {}

      // Ensure the SW is registered (if index.html already does this,
      // this call is harmless and will reuse the existing registration).
      if ("serviceWorker" in navigator) {
        // eslint-disable-next-line no-undef
        navigator.serviceWorker
          .register("./sw.js")
          .catch(function (err) {
            console.error("CI.CHEREV gate: SW register error", err);
          });
      }

      // If the browser already decided we're eligible as a PWA,
      // this will surface the install prompt right after the click.
      await tryTriggerPWAInstall();
    });
  }

  document.addEventListener("DOMContentLoaded", openGateIfNeeded);
})();
