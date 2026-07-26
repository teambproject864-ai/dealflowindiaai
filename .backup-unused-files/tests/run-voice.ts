// tests/run-voice.ts
import { runVoiceConfirmationTests } from "./voice-confirmation.test";

async function main() {
  try {
    await runVoiceConfirmationTests();
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

main();
