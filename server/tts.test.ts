import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock fetch for ElevenLabs API
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("tts.convert", () => {
  it("should convert text to speech and return base64 audio", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Mock successful ElevenLabs response
    const mockAudioData = new Uint8Array([0x49, 0x44, 0x33]); // Fake MP3 header
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => mockAudioData.buffer,
    });

    const result = await caller.tts.convert({ text: "Hello world" });

    expect(result).toHaveProperty("audio");
    expect(result).toHaveProperty("contentType", "audio/mpeg");
    expect(typeof result.audio).toBe("string");
    
    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("api.elevenlabs.io/v1/text-to-speech"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should throw error when ElevenLabs API fails", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Mock failed ElevenLabs response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(caller.tts.convert({ text: "Hello world" }))
      .rejects
      .toThrow("Failed to convert text to speech");
  });

  it("should truncate text longer than 5000 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const longText = "a".repeat(6000);
    const mockAudioData = new Uint8Array([0x49, 0x44, 0x33]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => mockAudioData.buffer,
    });

    await caller.tts.convert({ text: longText });

    // Verify the text was truncated in the request body
    const fetchCall = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.text.length).toBe(5000);
  });

  it("should reject empty text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.tts.convert({ text: "" }))
      .rejects
      .toThrow();
  });
});

describe("tts.voices", () => {
  it("should return list of available voices", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Mock ElevenLabs voices response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        voices: [
          { voice_id: "voice1", name: "Rachel", category: "premade" },
          { voice_id: "voice2", name: "Adam", category: "premade" },
        ],
      }),
    });

    const result = await caller.tts.voices();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "voice1",
      name: "Rachel",
      category: "premade",
    });
  });

  it("should throw error when voices API fails", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(caller.tts.voices())
      .rejects
      .toThrow("Failed to fetch voices");
  });
});
