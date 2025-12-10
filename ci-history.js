// --- CI History & PWA Instant Trigger ---
(function () {
  const IDB_NAME = 'CI_Mirror_DB';
  const IDB_STORE = 'engagement';

  let deferredPrompt = null;
  let installButton = null;

  // Helper to open IndexedDB
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.errorCode);
    });
  }

  // Function to check if engagement artifacts exist
  async function checkEngagementArtifacts() {
    try {
      const db = await openDB();
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get('install_eligible');

      return new Promise((resolve) => {
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  // --- 1. PWA Install Prompt Listener & Visibility ---
  window.addEventListener('beforeinstallprompt', function (e) {
    // Stop the default browser prompt sequence
    e.preventDefault();
    deferredPrompt = e;

    // Immediately check if the worker has seeded the history.
    checkEngagementArtifacts().then((isEngaged) => {
      if (isEngaged && !installButton) {
        // If engagement artifacts exist (meaning SW ran), make the install button visible.
        installButton = document.createElement('button');
        installButton.textContent = 'Install CI.CHEREV';
        installButton.setAttribute(
          'aria-label',
          'Install the CI.CHEREV Mirror app for The Table Well'
        );

        // Styling the visible install prompt/button
        Object.assign(installButton.style, {
          position: 'fixed',
          right: '1rem',
          bottom: '1rem',
          zIndex: '9999',
          padding: '0.6rem 1rem',
          borderRadius: '999px',
          border: 'none',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          background: 'rgba(15, 223, 209, 0.95)',
          color: '#000',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          transition: 'opacity 0.3s',
          opacity: 1
        });

        document.body.appendChild(installButton);

        installButton.addEventListener('click', async function () {
          if (!deferredPrompt) return;
          try {
            // Manually trigger the prompt
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
          } catch (err) {
            console.error('CI.CHEREV install prompt error:', err);
          }
          deferredPrompt = null;
          if (installButton && installButton.parentNode) {
            installButton.parentNode.removeChild(installButton);
          }
          installButton = null;
        });

        console.log('CI Mirror: PWA prompt eligibility met and visible.');
      }
    });
  });

  // Clean up button if app is already installed
  window.addEventListener('appinstalled', () => {
    if (installButton && installButton.parentNode) {
      installButton.parentNode.removeChild(installButton);
    }
  });

  // Listen for first engagement from gate.js
  window.addEventListener('ciengagement', (evt) => {
    console.log('CI engagement event received:', evt.detail);
    // This hook is here if we later want to do extra seeding from the client side.
  });
})();
