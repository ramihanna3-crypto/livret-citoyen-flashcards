import { createHash } from "node:crypto";

export function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

export type TtsOptions = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  text: string;
};

export async function tts(opts: TtsOptions): Promise<ArrayBuffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": opts.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: opts.modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status} ${res.statusText}: ${body}`);
  }
  return await res.arrayBuffer();
}
