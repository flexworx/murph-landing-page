export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Self-hosted TTS (Chatterbox) — PRIMARY
  ttsApiUrl: process.env.TTS_API_URL ?? "http://chatterbox:8880",
  // Self-hosted STT (faster-whisper)
  sttApiUrl: process.env.STT_API_URL ?? "http://whisper:9000",
  // Hume AI TTS — OPTIONAL FALLBACK (set TTS_PROVIDER=hume to activate)
  humeApiKey: process.env.HUME_API_KEY ?? "",
  ttsProvider: (process.env.TTS_PROVIDER ?? "chatterbox") as "chatterbox" | "hume",
};
