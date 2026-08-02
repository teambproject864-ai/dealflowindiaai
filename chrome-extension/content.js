// Dealflow Chrome Extension - Content Script
console.log("[Dealflow AI] Extension content script initialized on active page.");
// Function to extract page lead context
function extractPageContext() {
    const pageTitle = document.title || "";
    const pageUrl = window.location.href;
    let companyName = "";
    let prospectName = "";
    // LinkedIn context extraction
    if (pageUrl.includes("linkedin.com")) {
        const nameEl = document.querySelector("h1.text-heading-xlarge");
        if (nameEl)
            prospectName = nameEl.textContent?.trim() || "";
        const companyEl = document.querySelector("div.inline-show-more-text");
        if (companyEl)
            companyName = companyEl.textContent?.trim() || "";
    }
    else {
        companyName = pageTitle.split("-")[0]?.trim() || pageTitle;
    }
    return {
        pageTitle,
        pageUrl,
        companyName,
        prospectName,
        extractedAt: new Date().toISOString(),
    };
}
// Create a unobtrusive floating trigger badge on supported pages
function injectFloatingDealflowBadge() {
    if (document.getElementById("dealflow-extension-badge"))
        return;
    const badge = document.createElement("div");
    badge.id = "dealflow-extension-badge";
    badge.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      items-center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, rgba(13, 148, 136, 0.95), rgba(124, 58, 237, 0.95));
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      user-select: none;
    " id="dealflow-badge-button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span>Sync to Dealflow</span>
    </div>
  `;
    document.body.appendChild(badge);
    const btn = document.getElementById("dealflow-badge-button");
    if (btn) {
        btn.addEventListener("mouseenter", () => {
            btn.style.transform = "scale(1.05)";
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.transform = "scale(1)";
        });
        btn.addEventListener("click", () => {
            const context = extractPageContext();
            chrome.runtime.sendMessage({ type: "SYNC_LEAD_DATA", payload: context }, (response) => {
                if (response && response.success) {
                    btn.innerHTML = `<span>✓ Synced!</span>`;
                    setTimeout(() => injectFloatingDealflowBadge(), 2500);
                }
            });
        });
    }
}
// Inject floating badge when DOM is fully ready
if (document.readyState === "complete" || document.readyState === "interactive") {
    injectFloatingDealflowBadge();
}
else {
    window.addEventListener("DOMContentLoaded", injectFloatingDealflowBadge);
}
