// --- CI Gate Controller: Handles First Engagement ---
(function () {
  const gate = document.getElementById('ci-gate');
  const yes = document.getElementById('ci-gate-yes');
  const no = document.getElementById('ci-gate-no');
  if (!gate || !yes || !no) return;

  // Key for remembering that this device has already seen the gate
  const ENGAGEMENT_KEY = 'ci.gate.accepted';
  let isFirstVisit = false;

  try {
    if (!localStorage.getItem(ENGAGEMENT_KEY)) {
      isFirstVisit = true;
      // Gate is initially visible via CSS
    } else {
      // Already engaged, close the gate immediately via CSS class.
      gate.classList.add('ci-gate-closed');
    }
  } catch (e) {
    // Fallback if localStorage is disabled
    isFirstVisit = true;
  }

  function closeGate(choice) {
    // 1. Close the gate UI
    gate.classList.add('ci-gate-closed');

    if (isFirstVisit) {
      // 2. Mark engagement for future visits
      try {
        localStorage.setItem(ENGAGEMENT_KEY, choice);
      } catch (e) {}

      // 3. Fire Custom Engagement Event
      // This event signals to ci-history.js that user engagement has happened.
      window.dispatchEvent(
        new CustomEvent('ciengagement', { detail: { choice: choice } })
      );
      console.log(`CI Gate closed. First engagement recorded: ${choice}`);
    }
  }

  yes.addEventListener('click', function () {
    closeGate('yes');
  });

  no.addEventListener('click', function () {
    closeGate('no');
  });
})();
