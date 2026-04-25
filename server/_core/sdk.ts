/**
 * Auth SDK stub — Manus OAuth removed.
 * Thynx is self-hosted and open access (no login required).
 * Extend this to add JWT or session-based auth if needed.
 */
import type { Request } from "express";
import type { User } from "../../drizzle/schema";

export const sdk = {
  /**
   * Returns null for all requests — app is open access.
   * Replace with JWT verification if you add user accounts.
   */
  async authenticateRequest(_req: Request): Promise<User | null> {
    return null;
  },
};
