/**
 * Notification helpers — stub for Thynx voice app.
 * Extend this to add email/push notifications if needed.
 */
export async function notifyOwner(_payload: { title: string; content: string }): Promise<boolean> {
  // No-op in self-hosted mode
  return true;
}
