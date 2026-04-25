export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Self-hosted TTS (Chatterbox) and STT (faster-whisper)
  ttsApiUrl: process.env.TTS_API_URL ?? "http://chatterbox:8880",
  sttApiUrl: process.env.STT_API_URL ?? "http://whisper:9000",
};
