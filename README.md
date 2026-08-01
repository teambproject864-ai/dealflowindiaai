# Dealflow AI — Next-Generation B2B Deal Intelligence & Strategy Platform

Dealflow AI is an enterprise-grade platform specializing in B2B SaaS deal analysis, GTM playbook generation, and multi-agent AI orchestration.

---

## 🔒 Strict API Key & Configuration Management Policy

To ensure high-security compliance, zero-trust architecture, and prevent credential exposure, Dealflow AI enforces a **Strict API Key Management Policy**:

> [!IMPORTANT]
> **ALL API KEYS MUST BE EXCLUSIVELY STORED IN A SINGLE CENTRALIZED `.env.local` FILE.**
> - **NO HARDCODED KEYS**: Raw API key literals must NEVER be hardcoded in source code, configuration files, test scripts, or fallback defaults.
> - **NO KEYS IN `.env`**: Version-controlled files like `.env` and `.env.example` serve exclusively as structural templates. Plaintext keys in `.env` will trigger an application startup error and fail CI/CD build pipelines.
> - **GIT PRIVACY**: `.env.local` is listed in `.gitignore` and must NEVER be committed to version control.

---

## 🚀 Local Environment Setup Instructions for Developers

1. **Create Local Environment File**:
   Copy the configuration template `.env.example` to create your local secret store:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Required API Keys in `.env.local`**:
   Open `.env.local` and populate all required API keys:
   ```env
   # AI Provider Keys
   HUGGINGFACE_API_TOKEN=hf_your_huggingface_token
   NVIDIA_API_KEY=nvapi-your_nvidia_api_key
   ENC_KIMI_API_KEY='{"algorithm":"aes-256-gcm","version":"v1",...}' # Envelope encrypted Kimi key
   KIMI_API_KEY=sk-your_kimi_key
   OPENROUTER_API_KEY=sk-or-your_openrouter_key

   # Autonomous Agents & Integration Services
   RECALL_API_KEY=your_recall_ai_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   PINECONE_API_KEY=pcsk_your_pinecone_key
   ELEVENLABS_API_KEY=your_elevenlabs_key

   # Master Encryption & JWT Authentication Secrets
   LLM_API_KEY_ENCRYPTION_KEY=your_64_char_hex_key
   JWT_SECRET=your_jwt_secret
   ```

3. **Verify Environment Compliance**:
   Run the automated security scanner to ensure your setup complies with policy rules:
   ```bash
   npm run check:api-keys
   ```

---

## 🛠️ Development & Testing

- **Development Server**: `npm run dev`
- **Run Unit & Integration Test Suite**: `npm test`
- **Run Security API Key Audit**: `npm run check:api-keys`
- **Run Kimi Integration Verification**: `npx tsx scripts/test-kimi-integration.ts`
