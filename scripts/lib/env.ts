import { config } from "dotenv";
// Load .env.local first (developer-local secrets, git-ignored), then .env (committed defaults).
config({ path: ".env.local" });
config({ path: ".env" });

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(`✗ Missing required env var: ${name}`);
    console.error("  Copy .env.example → .env.local and fill in your keys.");
    process.exit(1);
  }
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  anthropicKey: () => required("ANTHROPIC_API_KEY"),
  anthropicModel: () => optional("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
  elevenLabsKey: () => required("ELEVENLABS_API_KEY"),
  elevenLabsVoiceId: () => required("ELEVENLABS_VOICE_ID"),
  elevenLabsModelId: () => optional("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"),
};
