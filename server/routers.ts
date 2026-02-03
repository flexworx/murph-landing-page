import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ElevenLabs API configuration - stored server-side for security
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_2b54f867aefad08ae6e0fa4c9caeb100f506d3adfccdda70";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Text-to-Speech router using ElevenLabs
  tts: router({
    convert: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(10000),
        voiceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { text, voiceId } = input;
        const voice = voiceId || ELEVENLABS_VOICE_ID;
        
        // Chunk text if too long (ElevenLabs has limits)
        const maxChars = 5000;
        const textToConvert = text.length > maxChars ? text.substring(0, maxChars) : text;

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
          {
            method: "POST",
            headers: {
              "Accept": "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: textToConvert,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ElevenLabs API error:", errorText);
          throw new Error(`Failed to convert text to speech: ${response.status}`);
        }

        // Convert audio to base64 for transmission
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        
        return {
          audio: base64Audio,
          contentType: "audio/mpeg",
        };
      }),
      
    // Get available voices
    voices: publicProcedure.query(async () => {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/voices",
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }

      const data = await response.json();
      return data.voices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
      }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
