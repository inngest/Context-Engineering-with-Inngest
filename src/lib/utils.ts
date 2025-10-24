// Utility functions

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return timestamp;
  }
}

