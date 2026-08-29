import assert from "assert";
import { billionmailService } from "@/lib/billionmail-service";
import { scrapeGraphService } from "@/lib/scrapegraph-service";
import { validateAPIKeyFormat, maskAPIKey } from "@/lib/customer-api-keys";
import { encryptAES, decryptAES } from "@/lib/security";
import { createHash } from "crypto";

export async function runBillionmailScrapeGraphIntegrationTests() {
  console.log("\n🧪 Running Billionmail & ScrapeGraphAI Integration Tests...\n");

  const testMasterKey = createHash("sha256").update("test-dealflow-key-vault").digest();

  // -------------------------------------------------------------
  // Test 1: API Key Vault & Encryption for Billionmail & ScrapeGraphAI
  // -------------------------------------------------------------
  console.log("  → [Security] Testing Billionmail and ScrapeGraphAI key validation & encryption");

  // Billionmail Key Format
  const bmValid = validateAPIKeyFormat("billionmail", "bm_live_981742634891238947");
  assert.strictEqual(bmValid.isValid, true, "Valid Billionmail key should pass");

  const bmInvalid = validateAPIKeyFormat("billionmail", "short");
  assert.strictEqual(bmInvalid.isValid, false, "Short Billionmail key should fail");

  // ScrapeGraphAI Key Format
  const sgValid = validateAPIKeyFormat("scrapegraph", "sgai-live-key-83748291048");
  assert.strictEqual(sgValid.isValid, true, "Valid ScrapeGraph key should pass");

  const sgInvalid = validateAPIKeyFormat("scrapegraph", "invalid-key");
  assert.strictEqual(sgInvalid.isValid, false, "Invalid prefix ScrapeGraph key should fail");

  // Masking
  const maskedBm = maskAPIKey("bm_live_981742634891238947");
  assert(maskedBm.startsWith("bm_l••••••••"), "Key should be masked with prefix preserved");

  // AES-256 Encryption & Decryption Roundtrip
  const secretKey = "sgai-production-secret-token-998822";
  const encrypted = encryptAES(secretKey, testMasterKey);
  const decrypted = decryptAES(encrypted, testMasterKey);
  assert.strictEqual(decrypted, secretKey, "AES-256 roundtrip must match original plaintext");

  // Billionmail Key Decryption via getApiKey
  const { saveCustomerAPIKey } = await import("@/lib/customer-api-keys");
  await saveCustomerAPIKey({
    customerId: "test-user-bm-key",
    provider: "billionmail",
    label: "Billionmail Test Key",
    rawKey: "bm_live_vault_secret_998811",
  });
  const retrievedDecryptedKey = await billionmailService.getApiKey("test-user-bm-key");
  assert.strictEqual(retrievedDecryptedKey, "bm_live_vault_secret_998811", "getApiKey must return decrypted key, not encrypted string");

  // ScrapeGraph Key Decryption via getApiKey
  await saveCustomerAPIKey({
    customerId: "test-user-sg-key",
    provider: "scrapegraph",
    label: "ScrapeGraph Test Key",
    rawKey: "sgai-live-vault-secret-998811",
  });
  const retrievedSgKey = await scrapeGraphService.getApiKey("test-user-sg-key");
  assert.strictEqual(retrievedSgKey, "sgai-live-vault-secret-998811", "scrapeGraphService.getApiKey must return decrypted key, not encrypted string");
  console.log("    ✓ API key format validation, AES-256 envelope encryption, and getApiKey decryption passed");

  // -------------------------------------------------------------
  // Test 2: Billionmail Campaign Life Cycle & Dispatch
  // -------------------------------------------------------------
  console.log("  → [Billionmail] Testing Campaign Lifecycle, Audience Sync & Scheduling");

  // 2.1 Sync Contacts
  const syncResult = await billionmailService.syncContacts([
    {
      email: "elena.test@dealflows.ai",
      firstName: "Elena",
      lastName: "Rostova",
      company: "Test Ventures",
      tags: ["qa", "enterprise"],
    },
    {
      email: "marcus.test@dealflows.ai",
      firstName: "Marcus",
      lastName: "Vance",
      company: "Test Capital",
      tags: ["investor"],
    },
  ]);
  assert.strictEqual(syncResult.syncedCount, 2, "Should sync 2 test contacts");

  const contactsList = await billionmailService.listContacts({ search: "elena.test" });
  assert(contactsList.length >= 1, "Should find synced contact by search query");
  assert.strictEqual(contactsList[0].email, "elena.test@dealflows.ai");

  // 2.2 Create Campaign
  const testCampaign = await billionmailService.createCampaign({
    userId: "test-user-1",
    userRole: "admin",
    title: "Automated Enterprise Dealflow Test",
    subject: "Accelerating {{company}} with DealFlow Outbound",
    senderName: "DealFlow Outbound",
    senderEmail: "outbound@dealflows.ai",
    audienceCount: 150,
    contentHtml: "<p>Hello {{firstName}}, welcome to DealFlow.</p>",
    sendImmediately: true,
  });

  assert(testCampaign.id.startsWith("bm-camp-"), "Campaign ID should follow bm-camp- format");
  assert.strictEqual(testCampaign.status, "sending", "Immediate campaign should have 'sending' status");
  assert(testCampaign.audienceCount > 0, "Audience count should be computed");

  // 2.2.1 Get Campaign by ID
  const fetchedCampaign = await billionmailService.getCampaign(testCampaign.id);
  assert.notStrictEqual(fetchedCampaign, null, "getCampaign should retrieve the campaign");
  assert.strictEqual(fetchedCampaign?.id, testCampaign.id, "Retrieved campaign ID must match");

  // 2.3 Webhook Event Ingestion
  const webhookResult = await billionmailService.processWebhook({
    event: "opened",
    campaignId: testCampaign.id,
    email: "elena.test@dealflows.ai",
    details: "Test Open Event from Webhook",
  });
  assert.strictEqual(webhookResult.success, true, "Webhook processing should succeed");

  // 2.4 Analytics Computation
  const analytics = await billionmailService.getAnalytics();
  assert(analytics.totalCampaigns >= 1, "Analytics should register created campaigns");
  assert(analytics.deliveryRate >= 0 && analytics.deliveryRate <= 100, "Delivery rate must be valid percentage");
  assert(analytics.timeSeries.length === 7, "Analytics must return 7-day trend array");

  // 2.5 Delete Campaign
  const deleteResult = await billionmailService.deleteCampaign(testCampaign.id);
  assert.strictEqual(deleteResult, true, "deleteCampaign should succeed");
  const postDeleteCampaign = await billionmailService.getCampaign(testCampaign.id);
  assert.strictEqual(postDeleteCampaign, null, "Campaign should not exist after deletion");

  console.log("    ✓ Billionmail campaign lifecycle, webhook ingestion, analytics, and deletion passed");

  // -------------------------------------------------------------
  // Test 3: ScrapeGraphAI Prompt Extraction & Native Warehouse Storage
  // -------------------------------------------------------------
  console.log("  → [ScrapeGraphAI] Testing SmartScraper, Pipeline Execution & Native Data Warehouse");

  const startJobTime = Date.now();
  const scrapeJob = await scrapeGraphService.createJob({
    userId: "test-user-1",
    userRole: "admin",
    title: "Test Stripe Pricing Extraction",
    engine: "smart_scraper",
    prompt: "Extract pricing tiers, security certificates, and target customer profiles.",
    url: "https://stripe.com/pricing",
    datasetName: "Stripe Test Dataset",
    targetSchema: {
      company: "string",
      pricingTiers: "array",
      securityBadges: "array",
    },
  });

  const durationMs = Date.now() - startJobTime;

  assert(scrapeJob.id.startsWith("sg-job-"), "Job ID should follow sg-job- format");
  assert.strictEqual(scrapeJob.status, "completed", "Job should complete successfully");
  assert(scrapeJob.recordCount >= 1, "Should have extracted structured records");
  assert(scrapeJob.resultDatasetId, "Should generate a Data Warehouse Dataset ID");
  assert(
    scrapeJob.executionTimeMs < 3000,
    `Execution time (${scrapeJob.executionTimeMs}ms) must be under 3000ms SLA`
  );
  assert(
    durationMs < 3000,
    `Total job creation wall time (${durationMs}ms) must complete under 3 seconds SLA`
  );

  // 3.2 Verify Data Warehouse Storage
  const dataset = await scrapeGraphService.getDataset(scrapeJob.resultDatasetId!);
  assert(dataset !== null, "Stored dataset must be retrievable from warehouse");
  assert.strictEqual(dataset?.title, "Stripe Test Dataset");
  assert(dataset!.records.length > 0, "Dataset must contain structured records");
  assert(dataset!.schemaFields.length > 0, "Dataset must contain schema fields");

  console.log(`    ✓ ScrapeGraphAI executed in ${scrapeJob.executionTimeMs}ms (< 3s SLA)`);
  console.log(`    ✓ Stored ${dataset!.recordCount} records in native Data Warehouse (${dataset!.id})`);

  // -------------------------------------------------------------
  // Test 4: Role-Based Access Controls & Unique Admin Identity Verification
  // -------------------------------------------------------------
  console.log("  → [RBAC & Identity] Testing Billionmail, ScrapeGraph RBAC and Demo Admin Uniqueness");

  const { isBillionmailFeatureAllowed } = await import("@/lib/billionmail-rbac");
  const { isScrapeGraphFeatureAllowed } = await import("@/lib/scrapegraph-rbac");
  const { DEMO_ADMIN, DEMO_ADMINS } = await import("@/lib/auth");

  // Billionmail RBAC checks
  assert.strictEqual(isBillionmailFeatureAllowed("admin", "campaign_create"), true, "Admin should be allowed campaign creation");
  assert.strictEqual(isBillionmailFeatureAllowed("admin", "campaign_delete"), true, "Admin should be allowed campaign deletion");
  assert.strictEqual(isBillionmailFeatureAllowed("agent", "campaign_view"), true, "Agent should be allowed campaign viewing");
  assert.strictEqual(isBillionmailFeatureAllowed("agent", "campaign_delete"), false, "Agent should not be allowed campaign deletion");
  assert.strictEqual(isBillionmailFeatureAllowed("customer", "analytics_view"), true, "Customer should be allowed analytics viewing");
  assert.strictEqual(isBillionmailFeatureAllowed("customer", "campaign_delete"), false, "Customer must NOT be allowed campaign deletion");
  assert.strictEqual(isBillionmailFeatureAllowed("anonymous" as any, "campaign_create"), false, "Anonymous role must be rejected");

  // ScrapeGraph RBAC checks
  assert.strictEqual(isScrapeGraphFeatureAllowed("admin", "job_create"), true, "Admin should be allowed job creation");
  assert.strictEqual(isScrapeGraphFeatureAllowed("admin", "dataset_delete"), true, "Admin should be allowed dataset deletion");
  assert.strictEqual(isScrapeGraphFeatureAllowed("agent", "job_view"), true, "Agent should be allowed job viewing");
  assert.strictEqual(isScrapeGraphFeatureAllowed("agent", "dataset_delete"), false, "Agent should not be allowed dataset deletion");
  assert.strictEqual(isScrapeGraphFeatureAllowed("customer", "dataset_view"), true, "Customer should be allowed dataset viewing");
  assert.strictEqual(isScrapeGraphFeatureAllowed("customer", "dataset_delete"), false, "Customer must NOT be allowed dataset deletion");
  assert.strictEqual(isScrapeGraphFeatureAllowed("guest" as any, "job_create"), false, "Guest role must be rejected");

  // Demo Admin Uniqueness
  assert.notStrictEqual(DEMO_ADMIN.id, DEMO_ADMINS[0].id, "DEMO_ADMIN id must differ from DEMO_ADMINS[0] id");
  assert.notStrictEqual(DEMO_ADMIN.id, DEMO_ADMINS[1].id, "DEMO_ADMIN id must differ from DEMO_ADMINS[1] id");
  assert.strictEqual(DEMO_ADMINS[0].id, "admin-1");
  assert.strictEqual(DEMO_ADMIN.id, "admin-2");
  assert.strictEqual(DEMO_ADMINS[1].id, "admin-3");
  assert.notStrictEqual(DEMO_ADMIN.email, DEMO_ADMINS[1].email, "DEMO_ADMIN email must differ from admin-3 email");
  assert.strictEqual(DEMO_ADMINS[1].email, "admin3@dealflow.ai");

  const { DEMO_AGENTS, DEMO_CUSTOMERS } = await import("@/lib/auth");
  const allAccounts = [DEMO_ADMIN, ...DEMO_ADMINS, ...DEMO_AGENTS, ...DEMO_CUSTOMERS];
  const allEmails = allAccounts.map(a => a.email.toLowerCase());
  const uniqueEmails = new Set(allEmails);
  assert.strictEqual(allEmails.length, uniqueEmails.size, "All demo accounts must have unique email addresses");

  const allHashedPasswords = allAccounts.map(a => a.hashedPassword);
  const uniqueHashedPasswords = new Set(allHashedPasswords);
  assert.strictEqual(allHashedPasswords.length, uniqueHashedPasswords.size, "All demo accounts must have distinct fallback passwords");

  // -------------------------------------------------------------
  // Test 5: Scoped Analytics & Role-Based Limit Enforcement
  // -------------------------------------------------------------
  console.log("  → [RBAC Limits & Scoping] Testing Audience Limits, Page Limits, and Analytics User Scoping");

  // 5.1 Analytics User Scoping
  const userACampaign = await billionmailService.createCampaign({
    userId: "user-alpha",
    userRole: "customer",
    title: "User Alpha Campaign",
    subject: "Subject Alpha",
    senderName: "Alpha",
    senderEmail: "alpha@test.com",
    contentHtml: "<p>Alpha</p>",
    audienceCount: 100,
  });

  const userBCampaign = await billionmailService.createCampaign({
    userId: "user-beta",
    userRole: "customer",
    title: "User Beta Campaign",
    subject: "Subject Beta",
    senderName: "Beta",
    senderEmail: "beta@test.com",
    contentHtml: "<p>Beta</p>",
    audienceCount: 200,
  });

  const alphaAnalytics = await billionmailService.getAnalytics("user-alpha");
  const betaAnalytics = await billionmailService.getAnalytics("user-beta");
  assert.strictEqual(alphaAnalytics.totalCampaigns, 1, "Alpha analytics should strictly contain 1 campaign");
  assert.strictEqual(betaAnalytics.totalCampaigns, 1, "Beta analytics should strictly contain 1 campaign");
  assert.strictEqual(alphaAnalytics.totalSent, 0, "Draft/non-immediate campaigns have 0 sent");

  // 5.2 Billionmail Audience Limit Enforcement
  let audienceLimitBlocked = false;
  try {
    await billionmailService.createCampaign({
      userId: "user-customer-limit",
      userRole: "customer", // customer maxAudienceSize = 5,000
      title: "Exceeding Campaign",
      subject: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
      contentHtml: "<p>Test</p>",
      audienceCount: 10000, // Exceeds 5,000 limit
    });
  } catch (err: any) {
    audienceLimitBlocked = err.message.includes("Forbidden: Audience size of 10000 exceeds your role limit");
  }
  assert.strictEqual(audienceLimitBlocked, true, "Campaign creation exceeding customer audience limit must be blocked");

  // 5.3 ScrapeGraph Page Limit Enforcement
  let pageLimitBlocked = false;
  try {
    await scrapeGraphService.createJob({
      userId: "user-customer-page-limit",
      userRole: "customer", // customer maxPages = 5
      engine: "smart_scraper",
      prompt: "Extract everything",
      url: "https://example.com",
      maxPages: 25, // Exceeds 5 limit
    });
  } catch (err: any) {
    pageLimitBlocked = err.message.includes("Forbidden: Requested page count of 25 exceeds your role limit");
  }
  assert.strictEqual(pageLimitBlocked, true, "Scraping job exceeding customer page limit must be blocked");

  // 5.4 Non-Numeric / Invalid Parameter Validation
  let invalidAudienceBlocked = false;
  try {
    await billionmailService.createCampaign({
      userId: "user-invalid-aud",
      userRole: "customer",
      title: "Invalid Audience Campaign",
      subject: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
      contentHtml: "<p>Test</p>",
      audienceCount: "non-numeric-value" as any,
    });
  } catch (err: any) {
    invalidAudienceBlocked = err.message.includes("Invalid audienceCount: must be a positive integer");
  }
  assert.strictEqual(invalidAudienceBlocked, true, "Non-numeric audienceCount must be rejected with validation error");

  let invalidPagesBlocked = false;
  try {
    await scrapeGraphService.createJob({
      userId: "user-invalid-pages",
      userRole: "customer",
      engine: "smart_scraper",
      prompt: "Extract data",
      url: "https://example.com",
      maxPages: "invalid-pages" as any,
    });
  } catch (err: any) {
    invalidPagesBlocked = err.message.includes("Invalid maxPages: must be a positive integer");
  }
  assert.strictEqual(invalidPagesBlocked, true, "Non-numeric maxPages must be rejected with validation error");

  // 5.5 Missing Audience Specification Test
  let missingAudienceBlocked = false;
  try {
    await billionmailService.createCampaign({
      userId: "user-missing-aud",
      userRole: "customer",
      title: "Missing Audience Campaign",
      subject: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
      contentHtml: "<p>Test</p>",
    });
  } catch (err: any) {
    missingAudienceBlocked = err.message.includes("Missing audience specification: either audienceCount or audienceListId must be provided");
  }
  assert.strictEqual(missingAudienceBlocked, true, "Campaign creation with neither audienceCount nor audienceListId must throw missing audience error");

  // 5.6 Contact User Isolation Test
  await billionmailService.syncContacts(
    [{ email: "isolated-user-1@test.com", firstName: "Isolated 1", tags: ["iso"] }],
    "user-iso-1"
  );
  await billionmailService.syncContacts(
    [{ email: "isolated-user-2@test.com", firstName: "Isolated 2", tags: ["iso"] }],
    "user-iso-2"
  );

  const user1Contacts = await billionmailService.listContacts({ userId: "user-iso-1" });
  const user2Contacts = await billionmailService.listContacts({ userId: "user-iso-2" });
  assert.strictEqual(user1Contacts.length, 1, "User 1 should only see their 1 isolated contact");
  assert.strictEqual(user1Contacts[0].email, "isolated-user-1@test.com");
  assert.strictEqual(user2Contacts.length, 1, "User 2 should only see their 1 isolated contact");
  assert.strictEqual(user2Contacts[0].email, "isolated-user-2@test.com");

  const user1ListScoped = await billionmailService.listContacts({ listId: "default-list", userId: "user-iso-1" });
  assert.strictEqual(user1ListScoped.length, 1, "User 1 listScoped should only return User 1's contacts in default-list");
  assert.strictEqual(user1ListScoped[0].email, "isolated-user-1@test.com");

  console.log("    ✓ User-scoped analytics, contact isolation, audience limits (5,000 max), page limits (5 max), and type validation verified");

  console.log("\n✅ All Billionmail & ScrapeGraphAI Integration Tests Passed Successfully!\n");
}
