// lib/voice-chat/voice-codec-fallback.ts

export type AudioCodecType = "audio/webm;codecs=opus" | "audio/mp4" | "audio/ogg;codecs=opus" | "audio/wav";

export interface DeviceNetworkCapabilities {
  deviceType: "desktop" | "mobile" | "tablet";
  os: "windows" | "macos" | "ios" | "android";
  browser: "chrome" | "firefox" | "safari" | "edge";
  effectiveNetworkType: "5g" | "4g" | "3g" | "low-bandwidth";
  supportedCodec: AudioCodecType;
  recommendedBitrateKbps: number;
  jitterBufferMs: number;
}

/**
 * Determines optimal audio codec, bitrate, and jitter buffer based on browser/OS and network conditions.
 */
export function negotiateAudioCapabilities(
  deviceType: "desktop" | "mobile" | "tablet",
  os: "windows" | "macos" | "ios" | "android",
  browser: "chrome" | "firefox" | "safari" | "edge",
  effectiveNetworkType: "5g" | "4g" | "3g" | "low-bandwidth" = "4g"
): DeviceNetworkCapabilities {
  let supportedCodec: AudioCodecType = "audio/webm;codecs=opus";
  let recommendedBitrateKbps = 64;
  let jitterBufferMs = 80;

  // iOS / Safari Codec Fallback
  if (os === "ios" || browser === "safari") {
    supportedCodec = "audio/mp4";
  } else if (browser === "firefox") {
    supportedCodec = "audio/ogg;codecs=opus";
  }

  // Network condition tuning
  if (effectiveNetworkType === "low-bandwidth" || effectiveNetworkType === "3g") {
    recommendedBitrateKbps = 24; // Low-bandwidth compressed audio
    jitterBufferMs = 250; // Increased jitter buffer to absorb packet loss
  } else if (effectiveNetworkType === "5g") {
    recommendedBitrateKbps = 128; // High fidelity audio
    jitterBufferMs = 40; // Low latency
  }

  return {
    deviceType,
    os,
    browser,
    effectiveNetworkType,
    supportedCodec,
    recommendedBitrateKbps,
    jitterBufferMs
  };
}

/**
 * Simulates reconnection and audio stream recovery when network connection drops.
 */
export function recoverVoiceConnection(sessionId: string, attemptCount: number): {
  recovered: boolean;
  reconnectLatencyMs: number;
  fallbackActive: boolean;
} {
  const reconnectLatencyMs = Math.min(1200, 150 + attemptCount * 100);
  return {
    recovered: true,
    reconnectLatencyMs,
    fallbackActive: attemptCount > 1
  };
}
