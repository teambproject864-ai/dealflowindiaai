import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let token = '';

for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('CALENDLY_API_TOKEN=')) {
    token = trimmed.split('=')[1].replace(/['"]/g, '').trim();
  }
}

if (!token) {
  console.error("No CALENDLY_API_TOKEN found in .env.local");
  process.exit(1);
}

const webhookTargetUrl = "https://dealsflowai.vercel.app/api/webhooks/calendly";

async function setup() {
  console.log("=== 1. FETCHING CALENDLY USER PROFILE ===");
  const userRes = await fetch("https://api.calendly.com/users/me", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!userRes.ok) {
    console.error("Failed to fetch user:", userRes.status, await userRes.text());
    process.exit(1);
  }

  const userData = await userRes.json();
  const user = userData.resource;
  console.log("✓ Authenticated Calendly User:", user.name, `<${user.email}>`);
  console.log("  User URI        :", user.uri);
  console.log("  Organization URI:", user.current_organization);

  console.log("\n=== 2. CHECKING EXISTING WEBHOOK SUBSCRIPTIONS ===");
  const listRes = await fetch(`https://api.calendly.com/webhook_subscriptions?organization=${encodeURIComponent(user.current_organization)}&scope=organization`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.collection || [];
    console.log(`Found ${existing.length} existing organization webhooks:`);
    for (const sub of existing) {
      console.log(` - ID: ${sub.uri}`);
      console.log(`   URL: ${sub.callback_url}`);
      console.log(`   State: ${sub.state}`);
      console.log(`   Events: ${sub.events?.join(', ')}`);
      if (sub.callback_url === webhookTargetUrl) {
        console.log("   ✓ Webhook is ALREADY registered!");
      }
    }
  }

  console.log("\n=== 3. CREATING WEBHOOK SUBSCRIPTION ===");
  const createPayload = {
    url: webhookTargetUrl,
    events: ["invitee.created", "invitee.canceled"],
    organization: user.current_organization,
    scope: "organization",
  };

  const createRes = await fetch("https://api.calendly.com/webhook_subscriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(createPayload)
  });

  const createStatus = createRes.status;
  const createText = await createRes.text();

  let signingKey = "";
  if (createRes.ok) {
    const createdData = JSON.parse(createText);
    const sub = createdData.resource;
    console.log("🎉 SUCCESS! Webhook created on Calendly:");
    console.log("   Callback URL:", sub.callback_url);
    console.log("   State       :", sub.state);
    console.log("   Events      :", sub.events?.join(', '));
    signingKey = sub.signing_key || "";
    if (signingKey) {
      console.log("   Signing Key :", signingKey);
    }
  } else if (createText.includes("already exists") || createStatus === 409) {
    console.log("✓ Webhook URL is already actively subscribed in Calendly!");
  } else {
    // Try user scope fallback if organization scope is restricted
    console.log(`Org-scope returned ${createStatus}, trying user scope...`);
    const userScopeRes = await fetch("https://api.calendly.com/webhook_subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookTargetUrl,
        events: ["invitee.created", "invitee.canceled"],
        user: user.uri,
        scope: "user",
        organization: user.current_organization,
      })
    });
    console.log("User scope result:", userScopeRes.status, await userScopeRes.text());
  }

  // If signing key was returned, persist it to .env.local
  if (signingKey) {
    let envFile = fs.readFileSync(envPath, 'utf8');
    if (envFile.includes("CALENDLY_WEBHOOK_SIGNING_KEY=")) {
      envFile = envFile.replace(/CALENDLY_WEBHOOK_SIGNING_KEY=.*(\r?\n|$)/, `CALENDLY_WEBHOOK_SIGNING_KEY=${signingKey}\n`);
    } else {
      envFile += `\nCALENDLY_WEBHOOK_SIGNING_KEY=${signingKey}\n`;
    }
    fs.writeFileSync(envPath, envFile, 'utf8');
    console.log("✓ Saved CALENDLY_WEBHOOK_SIGNING_KEY to .env.local!");
  }

  console.log("\n=== 4. QUERYING UPCOMING CALENDLY SCHEDULED EVENTS ===");
  const eventsRes = await fetch(`https://api.calendly.com/scheduled_events?user=${encodeURIComponent(user.uri)}&status=active`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (eventsRes.ok) {
    const eventsData = await eventsRes.json();
    const events = eventsData.collection || [];
    console.log(`Found ${events.length} upcoming scheduled events in Calendly:`);
    for (const ev of events) {
      console.log({
        name: ev.name,
        start_time: ev.start_time,
        end_time: ev.end_time,
        status: ev.status,
        location: ev.location,
      });

      // Also fetch invitees for this event to check details
      const inviteesRes = await fetch(`${ev.uri}/invitees`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (inviteesRes.ok) {
        const invData = await inviteesRes.json();
        for (const inv of invData.collection || []) {
          console.log(`   Invitee: ${inv.name} <${inv.email}>`);
        }
      }
    }
  } else {
    console.log("Events lookup notice:", eventsRes.status, await eventsRes.text());
  }
}

setup().catch(console.error);
