# DealFlow.AI Portal: Billionmail & ScrapeGraphAI User Guide

Welcome to the comprehensive user guide for **Billionmail** (Email Automation & Delivery Tracker) and **ScrapeGraphAI** (AI Web Scraping & Data Extraction Studio) within the DealFlow.AI Portal.

---

## 1. Accessing the New Integrations

Both integrations are accessible across all portal roles (**Customer**, **Agent**, and **Admin**):
- In the left sidebar navigation, locate:
  - **Billionmail Outbound Hub** under *Communications & Integrations*
  - **ScrapeGraphAI Studio** under *Overview & Intelligence*
- You can also access credential encryption directly under **API Key Vault** or the **Dealflow Connect & Integration Hub**.

---

## 2. Billionmail Outbound Hub

### 2.1 Launching an Automated Email Campaign
1. Navigate to **Billionmail Outbound Hub**.
2. Click **+ New Campaign** in the top right.
3. Fill in the Campaign Details:
   - **Campaign Title**: A descriptive name for tracking (e.g. *Q3 FinTech Outbound*).
   - **Email Subject Line**: Include dynamic variables like `{{company}}` or `{{firstName}}`.
   - **Sender Details**: Configured sender name and authenticated sender email.
   - **Email Body**: Enter rich HTML or plain text with personalization tokens.
4. Choose **Send Immediately** or select a scheduled date/time.
5. Click **Launch Campaign**.

### 2.2 Ingesting & Managing Audience Lists
1. Switch to the **Audience & Contacts** subtab.
2. Click **+ Add Single Contact** to add an individual lead.
3. Track active subscriber states (`subscribed`, `unsubscribed`, `bounced`).

### 2.3 Monitoring Real-time Telemetry & Webhooks
1. Open the **Delivery Telemetry & Charts** tab to view the 7-day conversion curve.
2. Open the **Live Event Ticker** to view real-time webhook updates as recipients open, click, or bounce.

---

## 3. ScrapeGraphAI Extraction Studio

### 3.1 Running a Prompt-Driven Web Scraping Job
1. Navigate to **ScrapeGraphAI Studio**.
2. Under the **Extraction Wizard**:
   - Choose the pipeline engine:
     - **SmartScraper**: Target a specific landing page or documentation portal.
     - **SearchScraper**: Search the web and aggregate multi-source data.
     - **ScriptScraper**: Generate a reusable extraction script.
   - Enter target URL (e.g. `https://stripe.com/pricing`).
   - Enter your prompt or click any of the **Quick Extraction Templates** (*Pricing & Enterprise Tiers*, *Leadership & Decision Makers*, *Tech Stack*, *Security Badges*).
3. Click **Execute ScrapeGraph Pipeline**.
4. The system executes the extraction in under 3.0 seconds and stores the resulting structured data.

### 3.2 Browsing the Native Data Warehouse
1. Switch to the **Native Data Warehouse** subtab.
2. Select any collection from the left sidebar.
3. Preview formatted structured tables with all schema columns.
4. Click **Export JSON** to download raw data or use it directly in GTM strategy engines.

---

## 4. API Key & Credential Security
To use custom API keys for Billionmail or ScrapeGraphAI:
1. Navigate to **API Key Vault** in the Portal.
2. Click **Add API Key**.
3. Select **Billionmail** (`bm_...`) or **ScrapeGraphAI** (`sgai-...`).
4. Enter your key. The key is instantly encrypted with AES-256 before storage and is never displayed in plaintext.
