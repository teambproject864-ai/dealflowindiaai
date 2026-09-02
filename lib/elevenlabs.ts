// lib/elevenlabs.ts
import { PERSONAS } from '@/prompts/personas';

export const PERSONA_VOICES: Record<string, string | undefined> = {
  alex: process.env.ELEVENLABS_VOICE_ALEX,
  sam: process.env.ELEVENLABS_VOICE_SAM,
  jordan: process.env.ELEVENLABS_VOICE_JORDAN,
  casey: process.env.ELEVENLABS_VOICE_CASEY,
};

export async function textToSpeech(text: string, personaKey?: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = (personaKey && PERSONA_VOICES[personaKey]) || PERSONA_VOICES.alex || '21m00Tcm4TlvDq8ikWAM';

  // Try ElevenLabs if an API key is configured
  if (apiKey && apiKey.startsWith('sk_')) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      });

      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
      console.warn('[TTS] ElevenLabs request failed, falling back to Google TTS:', response.status);
    } catch (err: any) {
      console.warn('[TTS] ElevenLabs error, falling back to Google TTS:', err.message);
    }
  }

  // Resilient Fallback: Google Neural TTS engine
  try {
    const cleanText = text.slice(0, 300); // URL limit safety
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=en&client=tw-ob`;
    const res = await fetch(ttsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  } catch (ttsErr: any) {
    console.error('[TTS] Google TTS fallback error:', ttsErr.message);
  }

  return Buffer.alloc(0);
}
