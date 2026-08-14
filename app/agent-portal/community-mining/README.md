# Community Mining Automation Engine — DealFlow AI

## Overview
The **Community Mining Automation System** continuously ingests unstructured customer and user feedback from multiple push and pull sources (support tickets, community chat, reviews, call transcripts, survey free-text), extracts intelligence via LLM processing (sentiment, theme tags, named entities, 1-sentence summaries, and vector embeddings), clusters feedback into actionable themes, and routes critical escalations to appropriate teams (Product, CS, Sales, Marketing) via Slack webhooks and email alerts.

---

## Architecture Pipeline

```
[ Push Sources / Webhooks ]   [ Live Call Transcripts ]   [ Scheduled Pull Reviews ]   [ Manual CSV/JSON Upload ]
             │                             │                           │                         │
             └─────────────────────────────┼───────────────────────────┴─────────────────────────┘
                                           ▼
                            [ Ingestion Layer (SHA-256 Dedup) ]
                                           │
                                  cm_raw_items / cm_ingestion_logs
                                           │
                                           ▼
                           [ LLM Processing Layer (Anthropic / HF) ]
                                           │
                                  cm_insights / cm_processing_logs
                                           │
                                           ▼
                           [ Daily Clustering Engine (Cosine Sim) ]
                                           │
                                  cm_themes (Velocity & Trends)
                                           │
                                           ▼
                          [ Routing & Notification Engine ]
                                           │
                                  cm_routing_rules / cm_notifications
                                           │
                                           ▼
                        [ Slack Webhooks / Resend Email Alerts ]
```

---

## Firestore Schema & Collections

| Collection Name | Description | Key Fields |
|---|---|---|
| `cm_sources` | Registered data sources | `id`, `name`, `type`, `status`, `config`, `itemCount`, `lastSyncedAt` |
| `cm_raw_items` | Raw ingested items | `id`, `sourceId`, `externalId`, `dedupHash`, `rawText`, `author`, `planTier`, `processed` |
| `cm_insights` | LLM analysis per item | `id`, `rawItemId`, `sentiment`, `sentimentScore`, `themeTags`, `entities`, `severity`, `summary`, `embeddingVector` |
| `cm_themes` | Aggregated theme clusters | `id`, `label`, `description`, `itemCount`, `trend`, `sentimentAvg`, `severity`, `status`, `assignedTeam`, `sampleQuotes` |
| `cm_routing_rules` | Rules mapping keywords → team | `id`, `name`, `keywords`, `categories`, `assignedTeam`, `destinationChannel`, `destinationTarget`, `minSeverity` |
| `cm_notifications` | Notification dispatch queue | `id`, `themeId`, `themeLabel`, `summary`, `severity`, `destinationType`, `destination`, `status`, `deepLink` |
| `cm_ingestion_logs` | Ingestion audit trail | `id`, `sourceId`, `itemsReceived`, `itemsIngested`, `itemsDeduped`, `status`, `timestamp` |
| `cm_processing_logs` | LLM token usage & cost tracker | `id`, `sourceId`, `itemCount`, `tokensUsed`, `estimatedCostUsd`, `modelUsed`, `provider`, `timestamp` |

---

## API Endpoints

- `POST /api/community-mining/webhook` — Push webhook for external ticketing & in-app feedback (deduplicates by SHA-256 fingerprint).
- `POST /api/community-mining/upload` — Manual CSV/JSON file upload for one-off backfills.
- `POST /api/community-mining/process` — Batch LLM extraction trigger.
- `GET /api/community-mining/cron/pull` — Scheduled polling runner for reviews & forums.
- `GET /api/community-mining/cron/cluster` — Daily vector clustering runner.
- `GET|POST|DELETE /api/community-mining/rules` — Manage routing rules and test alerts.
- `GET /api/community-mining/stats` — Dashboard statistics overview.
- `GET|PATCH /api/community-mining/themes` — Retrieve & update theme status (`new` | `reviewed` | `actioned`).
- `GET /api/community-mining/feedback` — Search & filter raw feedback stream.

---

## How to Add a New Data Source

### 1. Push-Based Webhook Source (e.g. Zendesk / Intercom / Formspree)
1. Configure your external service to send a `POST` HTTP request to:
   ```
   POST https://dealflow.ai/api/community-mining/webhook
   Headers: Content-Type: application/json
   ```
2. Payload structure:
   ```json
   {
     "sourceId": "src_zendesk",
     "sourceType": "support",
     "externalId": "ticket_98234",
     "rawText": "Customer reports that deal exports are timing out.",
     "author": { "name": "Alice Smith", "email": "alice@corp.com" },
     "planTier": "enterprise"
   }
   ```

### 2. Pull-Based Scheduled Poller (e.g. Trustpilot / ProductHunt)
1. Register the source in `cm_sources` with `type: "review"` or `"community"`.
2. Add the polling client connector in `app/api/community-mining/cron/pull/route.ts` inside `handleCronPull`.
3. Normalize records into `IngestItemPayload[]` and pass to `ingestRawItems()`.

---

## Cost & Rate Limiting Controls
- Rate limits on `/api/community-mining/*` ingestion routes.
- Configurable `dailyItemCap` per registered source.
- Batch processing queues to respect Anthropic API rate limits (`claude-3-haiku` / fallback provider).
- Every processing execution logs token consumption and cost to `cm_processing_logs`.
