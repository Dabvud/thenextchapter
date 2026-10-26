export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Teilen-Menü des Handys, sonst Zwischenablage. Abbruch durch den Nutzer ist kein Fehler. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
