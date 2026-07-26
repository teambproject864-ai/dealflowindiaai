// tests/run-twilio.ts
import { runTwilioServiceTests } from "./twilio-service.test";

async function main() {
  try {
    await runTwilioServiceTests();
    process.exit(0);
  } catch (error) {
    console.error("Twilio test execution failed:", error);
    process.exit(1);
  }
}

main();
