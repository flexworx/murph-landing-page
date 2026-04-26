import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// TTS Provider: Piper (primary, self-hosted, free) or Hume AI (optional cloud)
// Switch with env var: TTS_PROVIDER=hume  (default: piper)
// ─────────────────────────────────────────────────────────────────────────────

const PIPER_VOICES = [
  { id: "en_US-lessac-medium",   name: "Lessac (US)",   category: "piper" },
  { id: "en_US-amy-medium",      name: "Amy (US)",      category: "piper" },
  { id: "en_US-ryan-high",       name: "Ryan (US)",     category: "piper" },
  { id: "en_US-joe-medium",      name: "Joe (US)",      category: "piper" },
  { id: "en_GB-alan-medium",     name: "Alan (UK)",     category: "piper" },
  { id: "en_GB-southern_english_female-low", name: "Sophie (UK)", category: "piper" },
  { id: "en_US-kusal-medium",    name: "Kusal (US)",    category: "piper" },
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

// ── Piper TTS (Wyoming protocol HTTP wrapper) ────────────────────────────────
async function callPiperTTS(text: string, voice: string): Promise<ArrayBuffer> {
  // Piper Wyoming server exposes a simple HTTP endpoint: POST /api/tts?voice=<voice>
  const url = `${ENV.ttsApiUrl}/api/tts`;
  const params = new URLSearchParams({ voice });
  const response = await fetch(`${url}?${params}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: text,
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Piper TTS error ${response.status}: ${err}`);
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
 * Piper is always primary. Hume is used only when TTS_PROVIDER=hume.
 * If Hume fails, automatically falls back to Piper.
 */
async function synthesizeSpeech(text: string, voice: string): Promise<ArrayBuffer> {
  if (ENV.ttsProvider === "hume" && ENV.humeApiKey) {
    try {
      return await callHumeTTS(text, voice);
    } catch (err) {
      console.warn("[TTS] Hume failed, falling back to Piper:", err);
      return callPiperTTS(text, "en_US-lessac-medium");
    }
  }
  return callPiperTTS(text, voice);
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
        : PIPER_VOICES;
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
