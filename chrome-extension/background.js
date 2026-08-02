// Dealflow Chrome Extension - Background Service Worker (Manifest v3)
const DEFAULT_SERVER_URL = "http://localhost:3000";
// --- Lifecycle Event Listeners ---
chrome.runtime.onInstalled.addListener((details) => {
    console.log("[Dealflow Background Worker] Extension installed successfully:", details.reason);
    // Set default configuration in storage
    chrome.storage.sync.get(["serverUrl"], (result) => {
        if (!result.serverUrl) {
            chrome.storage.sync.set({ serverUrl: DEFAULT_SERVER_URL });
        }
    });
    // Setup periodic background sync alarm (every 5 minutes)
    chrome.alarms.create("dealflow-background-sync", { periodInMinutes: 5 });
});
// Alarm Listener for background sync
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dealflow-background-sync") {
        performBackgroundSync();
    }
});
// Message Listener from Popup and Content Scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_EXTENSION_STATUS") {
        chrome.storage.sync.get(["apiToken", "userRole", "serverUrl"], (data) => {
            sendResponse({
                success: true,
                authenticated: !!data.apiToken,
                role: data.userRole || "guest",
                serverUrl: data.serverUrl || DEFAULT_SERVER_URL,
            });
        });
        return true; // async response
    }
    if (message.type === "SYNC_LEAD_DATA") {
        handleLeadDataSync(message.payload)
            .then((res) => sendResponse({ success: true, data: res }))
            .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
    }
    if (message.type === "TRIGGER_NOTIFICATION") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: message.title || "Dealflow AI Alert",
            message: message.message || "New revenue intelligence event detected.",
            priority: 2,
        });
        sendResponse({ success: true });
        return true;
    }
});
async function performBackgroundSync() {
    try {
        const data = await chrome.storage.sync.get(["apiToken", "serverUrl"]);
        if (!data.apiToken)
            return;
        const serverUrl = data.serverUrl || DEFAULT_SERVER_URL;
        const response = await fetch(`${serverUrl}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${data.apiToken}`,
            },
        });
        if (response.ok) {
            const userInfo = await response.json();
            await chrome.storage.sync.set({
                lastSyncTimestamp: new Date().toISOString(),
                userRole: userInfo.user?.role || "customer",
            });
        }
    }
    catch (error) {
        console.warn("[Dealflow Background Sync] Failed background ping:", error);
    }
}
async function handleLeadDataSync(payload) {
    const data = await chrome.storage.sync.get(["apiToken", "serverUrl"]);
    const serverUrl = data.serverUrl || DEFAULT_SERVER_URL;
    const response = await fetch(`${serverUrl}/api/leads/save`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(data.apiToken ? { Authorization: `Bearer ${data.apiToken}` } : {}),
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
    }
    return await response.json();
}
