import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sha1, tts } from "./tts";

describe("sha1", () => {
  it("produces stable 40-char hex digest", () => {
    expect(sha1("hello")).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
    expect(sha1("hello").length).toBe(40);
  });
});

describe("tts", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("FAKE_MP3_BYTES").buffer,
    });
    // @ts-expect-error -- override global fetch for test
    globalThis.fetch = fetchMock;
  });
  afterEach(() => {
    // @ts-expect-error -- restore
    globalThis.fetch = undefined;
  });

  it("posts to the right URL with the right headers", async () => {
    const buf = await tts({
      apiKey: "key",
      voiceId: "v1",
      modelId: "eleven_multilingual_v2",
      text: "Bonjour le monde",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/v1");
    expect(init.method).toBe("POST");
    expect(init.headers["xi-api-key"]).toBe("key");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body.text).toBe("Bonjour le monde");
    expect(body.model_id).toBe("eleven_multilingual_v2");
    expect(body.voice_settings).toEqual({ stability: 0.5, similarity_boost: 0.75 });
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it("throws on non-OK response with body included in the error message", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => '{"detail":"invalid_api_key"}',
    });
    await expect(
      tts({ apiKey: "bad", voiceId: "v1", modelId: "m", text: "x" }),
    ).rejects.toThrow(/401|invalid_api_key/);
  });
});
