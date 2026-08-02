# Dealflow AI Chrome Extension (Manifest v3)

A fully functional, high-performance Chrome Extension for Dealflow AI that connects browser context directly into the Dealflow revenue operations platform.

## Key Features

1. **Manifest v3 Compliance**: Uses Background Service Workers (`background.ts`), non-blocking alarm timers, and minimal permission scopes.
2. **Instant Lead Context Scraper**: Automatically detects prospect names, companies, and URLs from LinkedIn, CRM systems, or company websites.
3. **Real-time Pipeline Sync**: Synchronizes leads directly to the Dealflow backend API (`/api/leads/save`).
4. **Sub-2s Load & <5% CPU**: Optimized DOM listeners, lightweight popup HTML/JS, and background workers ensure near-zero performance overhead.
5. **Secure Token Storage**: Utilizes `chrome.storage.sync` and ephemeral session keys.

## Installation Instructions

1. (Optional) Run `npm run build:extension` in the workspace root if you modify any TypeScript source files in `src/`.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `chrome-extension` directory (`D:\Project\DealFlow.AI\dealsflowsai\chrome-extension`).
6. Pin the Dealflow AI Assistant icon to your Chrome toolbar for quick access.
