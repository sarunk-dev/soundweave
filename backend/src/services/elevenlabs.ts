import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY  = process.env.ELEVENLABS_API_KEY!;
const BASE_URL = 'https://api.elevenlabs.io/v1';

export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
}

export async function generateSpeech(
  voiceId: string,
  text: string,
  settings: VoiceSettings = {}
): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key':   API_KEY,
      'Content-Type': 'application/json',
      'Accept':       'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability:        settings.stability        ?? 0.5,
        similarity_boost: settings.similarity_boost ?? 0.8,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function listVoices(): Promise<{ voice_id: string; name: string }[]> {
  const res = await fetch(`${BASE_URL}/voices`, {
    headers: { 'xi-api-key': API_KEY },
  });
  const data = await res.json() as any;
  return data.voices ?? [];
}
