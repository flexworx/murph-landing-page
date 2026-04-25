import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Chatterbox TTS — self-hosted, OpenAI-compatible API
// Runs as a Docker service at TTS_API_URL (default: http://chatterbox:8880)
// ─────────────────────────────────────────────────────────────────────────────

const CHATTERBOX_VOICES = [
  { id: "default",  name: "Default",  category: "built-in" },
  { id: "male_1",   name: "Marcus",   category: "built-in" },
  { id: "female_1", name: "Aria",     category: "built-in" },
  { id: "male_2",   name: "James",    category: "built-in" },
  { id: "female_2", name: "Nova",     category: "built-in" },
  { id: "male_3",   name: "Oliver",   category: "built-in" },
  { id: "female_3", name: "Sage",     category: "built-in" },
];

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

async function callChatterboxTTS(text: string, voice: string): Promise<ArrayBuffer> {
  const url = `${ENV.ttsApiUrl}/v1/audio/speech`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", input: text, voice, response_format: "mp3" }),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`TTS service error ${response.status}: ${err}`);
  }
  return response.arrayBuffer();
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
          audioBuffers.push(await callChatterboxTTS(chunk, voiceId));
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
        };
      }),

    voices: publicProcedure.query(() => CHATTERBOX_VOICES),
  }),

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
