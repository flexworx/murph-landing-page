import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// TTS Provider: Chatterbox (primary, self-hosted) or Hume AI (optional cloud)
// Switch with env var: TTS_PROVIDER=hume  (default: chatterbox)
// ─────────────────────────────────────────────────────────────────────────────

const CHATTERBOX_VOICES = [
  { id: "default",  name: "Default",  category: "chatterbox" },
  { id: "male_1",   name: "Marcus",   category: "chatterbox" },
  { id: "female_1", name: "Aria",     category: "chatterbox" },
  { id: "male_2",   name: "James",    category: "chatterbox" },
  { id: "female_2", name: "Nova",     category: "chatterbox" },
  { id: "male_3",   name: "Oliver",   category: "chatterbox" },
  { id: "female_3", name: "Sage",     category: "chatterbox" },
];

const HUME_VOICES = [
  { id: "ITO",       name: "Ito",       category: "hume" },
  { id: "KORA",      name: "Kora",      category: "hume" },
  { id: "DACHER",    name: "Dacher",    category: "hume" },
  { id: "AURA",      name: "Aura",      category: "hume" },
  { id: "FINN",      name: "Finn",      category: "hume" },
  { id: "WHIMSY",    name: "Whimsy",    category: "hume" },
  { id: "STELLA",    name: "Stella",    category: "hume" },
  { id: "SUNNY",     name: "Sunny",     category: "hume" },
];

/**
 * Split text into sentence-boundary chunks of at most maxChars characters.
 */
function chunkText(text: string, maxChars = 4500): string[] {
  if (text.length <= maxChars) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ── Chatterbox TTS (OpenAI-compatible /v1/audio/speech) ──────────────────────
async function callChatterboxTTS(text: string, voice: string): Promise<ArrayBuffer> {
  const url = `${ENV.ttsApiUrl}/v1/audio/speech`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", input: text, voice, response_format: "mp3" }),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Chatterbox TTS error ${response.status}: ${err}`);
  }
  return response.arrayBuffer();
}

// ── Hume AI TTS (optional cloud fallback) ────────────────────────────────────
async function callHumeTTS(text: string, voice: string): Promise<ArrayBuffer> {
  if (!ENV.humeApiKey) {
    throw new Error("HUME_API_KEY is not configured — falling back to Chatterbox");
  }
  const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hume-Api-Key": ENV.humeApiKey,
    },
    body: JSON.stringify({
      utterances: [{ text, voice: { name: voice } }],
      format: { type: "mp3" },
      num_channels: 1,
      sample_rate: 24000,
    }),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Hume TTS error ${response.status}: ${err}`);
  }
  // Hume returns JSON with base64 audio
  const data = await response.json() as { generations: Array<{ audio: string }> };
  const base64 = data.generations?.[0]?.audio;
  if (!base64) throw new Error("Hume TTS returned no audio");
  return Buffer.from(base64, "base64").buffer as ArrayBuffer;
}

/**
 * Route TTS call to the active provider.
 * Chatterbox is always primary. Hume is used only when TTS_PROVIDER=hume.
 * If Hume fails, automatically falls back to Chatterbox.
 */
async function synthesizeSpeech(text: string, voice: string): Promise<ArrayBuffer> {
  if (ENV.ttsProvider === "hume" && ENV.humeApiKey) {
    try {
      return await callHumeTTS(text, voice);
    } catch (err) {
      console.warn("[TTS] Hume failed, falling back to Chatterbox:", err);
      return callChatterboxTTS(text, "default");
    }
  }
  return callChatterboxTTS(text, voice);
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Text-to-Speech ──────────────────────────────────────────────────────
  tts: router({
    convert: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(200000),
        voiceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { text, voiceId = "default" } = input;
        const chunks = chunkText(text);
        const audioBuffers: ArrayBuffer[] = [];
        for (const chunk of chunks) {
          audioBuffers.push(await synthesizeSpeech(chunk, voiceId));
        }
        const totalLength = audioBuffers.reduce((s, b) => s + b.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of audioBuffers) {
          combined.set(new Uint8Array(buf), offset);
          offset += buf.byteLength;
        }
        return {
          audio: Buffer.from(combined).toString("base64"),
          contentType: "audio/mpeg",
          chunks: chunks.length,
          provider: ENV.ttsProvider,
        };
      }),

    voices: publicProcedure.query(() => {
      // Return voices for the active provider
      return ENV.ttsProvider === "hume" && ENV.humeApiKey
        ? HUME_VOICES
        : CHATTERBOX_VOICES;
    }),

    // Returns which provider is currently active
    provider: publicProcedure.query(() => ({
      active: ENV.ttsProvider,
      humeAvailable: Boolean(ENV.humeApiKey),
    })),
  }),

  // ── Speech-to-Text (faster-whisper — self-hosted) ───────────────────────
  stt: router({
    transcribe: publicProcedure
      .input(z.object({
        audioBase64: z.string(),
        mimeType: z.string().default("audio/webm"),
        language: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { audioBase64, mimeType, language } = input;
        const audioBuffer = Buffer.from(audioBase64, "base64");
        const ext = mimeType.includes("mp3") ? "mp3"
          : mimeType.includes("wav") ? "wav"
          : mimeType.includes("ogg") ? "ogg"
          : "webm";
        const formData = new FormData();
        formData.append("file", new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
        formData.append("model", "whisper-1");
        if (language) formData.append("language", language);
        const url = `${ENV.sttApiUrl}/v1/audio/transcriptions`;
        const response = await fetch(url, { method: "POST", body: formData });
        if (!response.ok) {
          const err = await response.text().catch(() => "");
          throw new Error(`STT service error ${response.status}: ${err}`);
        }
        const result = await response.json() as { text: string };
        return { text: result.text };
      }),
  }),
});

export type AppRouter = typeof appRouter;
