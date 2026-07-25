// lib/call-bot/config.ts

export function isCallBotEnabled(): boolean {
  const envVal = process.env.ENABLE_CALL_BOT;
  if (envVal === undefined || envVal === null || envVal === "") {
    return true; // Default enabled unless explicitly set to "false" or "0"
  }
  return envVal.toLowerCase() !== "false" && envVal !== "0";
}
