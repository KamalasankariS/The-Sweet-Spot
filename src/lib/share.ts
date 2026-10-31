/**
 * Native share utility using the Web Share API.
 * Falls back to clipboard copy on unsupported browsers.
 */

interface ShareData {
  title: string;
  text: string;
  url: string;
}

export async function nativeShare(data: ShareData): Promise<"shared" | "copied" | "failed"> {
  // Use native share sheet if available (mobile browsers, Safari, etc.)
  if (navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      // User cancelled the share — not an error
      if (err instanceof Error && err.name === "AbortError") {
        return "failed";
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}

export function shareItinerary(groupName: string, url: string) {
  return nativeShare({
    title: `${groupName} — The Sweet Spot`,
    text: `Check out our group's perfect night plan on The Sweet Spot!`,
    url,
  });
}

export function shareDNACard(name: string, url: string) {
  return nativeShare({
    title: `${name}'s Cultural DNA — The Sweet Spot`,
    text: `Check out my Cultural DNA card on The Sweet Spot!`,
    url,
  });
}

export function shareGroupInvite(groupName: string, url: string) {
  return nativeShare({
    title: `Join ${groupName} on The Sweet Spot`,
    text: `Join our group on The Sweet Spot and let's find the perfect night out together!`,
    url,
  });
}
