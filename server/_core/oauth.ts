import type { Express } from "express";

/**
 * OAuth routes removed — Manus OAuth replaced with simple JWT session auth.
 * Authentication is handled via JWT_SECRET in server/_core/trpc.ts context.
 */
export function registerOAuthRoutes(_app: Express): void {
  // No external OAuth provider — app is self-hosted and open access
}
