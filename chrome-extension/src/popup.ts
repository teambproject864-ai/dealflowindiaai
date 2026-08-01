// Dealflow Chrome Extension - Popup Interaction Script

document.addEventListener("DOMContentLoaded", () => {
  const syncBtn = document.getElementById("sync-current-tab");
  const openAgentBtn = document.getElementById("btn-open-agent");
  const openCustomerBtn = document.getElementById("btn-open-customer");

  if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
      syncBtn.innerHTML = `<span>⏳ Extracting...</span>`;
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          const payload = {
            pageTitle: activeTab.title || "",
            pageUrl: activeTab.url || "",
            extractedAt: new Date().toISOString(),
          };

          chrome.runtime.sendMessage(
            { type: "SYNC_LEAD_DATA", payload },
            (res) => {
              if (res && res.success) {
                syncBtn.innerHTML = `<span>✓ Synced to Dealflow!</span>`;
                setTimeout(() => {
                  syncBtn.innerHTML = `<span>⚡ Sync Active Tab</span>`;
                }, 2000);
              } else {
                syncBtn.innerHTML = `<span>❌ Error Syncing</span>`;
                setTimeout(() => {
                  syncBtn.innerHTML = `<span>⚡ Sync Active Tab</span>`;
                }, 2000);
              }
            }
          );
        }
      });
    });
  }

  if (openAgentBtn) {
    openAgentBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:3000/portal/agent" });
    });
  }

  if (openCustomerBtn) {
    openCustomerBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:3000/portal/customer" });
    });
  }
});
