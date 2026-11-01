// Content moderation for profile text and images.
// Screens names, bios, and filenames for inappropriate content.
// Songs are explicitly excluded from moderation per product decision.

// Profanity / slur blocklist — covers common offensive terms and l33t-speak variants.
// This is intentionally comprehensive but not exhaustive; production would use a service.
// Words checked as substring (always blocked if found anywhere)
const BLOCKED_SUBSTRINGS = [
  "fuck","shit","cunt","dick","cock","pussy",
  "nigger","nigga","faggot","whore","slut",
  "asshole","arsehole","motherfuck",
  "porn","hentai","xxx","nsfw","nude","nudes","naked",
  "dildo","vibrator","orgasm","blowjob","handjob","cumshot",
  "boob","tits","titties","penis","vagina","erection",
  "kike","spic","wetback","chink","gook","beaner",
  "tranny","shemale","dyke",
  "rape","molest","pedophile","pedo",
  "cocksucker","dickhead","asswipe","shithead","fuckface",
  "bitchass","dumbass","jackass","fatass","badass",
];

// Words checked with word boundaries (to avoid false positives in normal words)
const BLOCKED_WORDS = [
  "ass","bitch","damn","fag","retard","retarded",
  "bastard","piss","twat","wanker","bollocks",
  "mfer","stfu","gtfo","wtf",
  "sex","sexy","anal",
  "kill","murder","cracker",
  // Common l33t substitutions
  "f*ck","sh*t","a$$","b!tch","d!ck","c0ck","pu$$y",
  "f**k","s**t","b**ch","n**ga","n**ger",
  "fck","fuk","fuq","sht","btch","dck","cnt",
];

// Blocked emoji sequences (obscene gestures/combinations)
const BLOCKED_EMOJI_PATTERNS = [
  "\u{1F346}\u{1F4A6}", // eggplant + sweat
  "\u{1F351}\u{1F4A6}", // peach + sweat
  "\u{1F595}",          // middle finger
];

// Unicode homoglyphs → ASCII
const HOMOGLYPHS: Record<string, string> = {
  "а": "a", "с": "c", "е": "e", "і": "i", "о": "o", "р": "p",
  "ѕ": "s", "у": "y", "х": "x", "ɑ": "a", "ϲ": "c", "ε": "e",
  "ο": "o", "υ": "u", "ν": "v", "ω": "w", "ʀ": "r", "ᴋ": "k",
  "ɪ": "i", "ʜ": "h", "ᴅ": "d", "ʙ": "b", "ᴛ": "t", "ꜱ": "s",
};

function normalizeText(text: string): string {
  let t = text.toLowerCase();
  // Replace unicode homoglyphs
  t = t.replace(/./g, (ch) => HOMOGLYPHS[ch] || ch);
  // l33t speak substitutions
  t = t
    .replace(/[0@]/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/[!|]/g, "i")
    .replace(/[*_\-.~`'"]/g, "");
  // Collapse repeated characters (fuuuck → fuck, shhit → shit)
  t = t.replace(/(.)\1{2,}/g, "$1");
  return t;
}

// Additional normalization that strips ALL non-alpha to catch spaced-out evasions
function normalizeStripped(text: string): string {
  return normalizeText(text).replace(/[^a-z]/g, "");
}

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export function moderateText(text: string, fieldName: string): ModerationResult {
  if (!text.trim()) return { passed: true };

  const normalized = normalizeText(text);
  const stripped = normalizeStripped(text);

  // 1. Substring check — these are always bad regardless of context
  for (const word of BLOCKED_SUBSTRINGS) {
    const nw = normalizeText(word);
    // Check in normalized text (preserves spaces)
    if (normalized.includes(nw)) {
      return { passed: false, reason: `${fieldName} contains inappropriate language. Please keep it clean.` };
    }
    // Also check in fully stripped text (catches "f u c k", "c.o.c.k", etc.)
    if (stripped.includes(nw)) {
      return { passed: false, reason: `${fieldName} contains inappropriate language. Please keep it clean.` };
    }
  }

  // 2. Word-boundary check — avoid false positives (e.g. "class" contains "ass")
  for (const word of BLOCKED_WORDS) {
    const nw = normalizeText(word);
    const regex = new RegExp(`(?:^|[^a-z])${escapeRegex(nw)}(?:[^a-z]|$)`);
    if (regex.test(normalized)) {
      return { passed: false, reason: `${fieldName} contains inappropriate language. Please keep it clean.` };
    }
  }

  // 3. Check blocked emoji patterns
  for (const pattern of BLOCKED_EMOJI_PATTERNS) {
    if (text.includes(pattern)) {
      return { passed: false, reason: `${fieldName} contains inappropriate emoji. Please remove it.` };
    }
  }

  return { passed: true };
}

export function moderateName(name: string): ModerationResult {
  return moderateText(name, "Name");
}

export function moderateBio(bio: string): ModerationResult {
  return moderateText(bio, "Bio");
}

// Validate uploaded image file
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export function moderateImageFile(file: File): ModerationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      passed: false,
      reason: "Only JPEG, PNG, GIF, and WebP images are allowed.",
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      passed: false,
      reason: "Image must be under 5 MB.",
    };
  }

  // Check filename for inappropriate content
  const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
  const nameCheck = moderateText(nameWithoutExt, "Image filename");
  if (!nameCheck.passed) {
    return {
      passed: false,
      reason: "Image filename contains inappropriate content. Please rename the file.",
    };
  }

  return { passed: true };
}

// Resize image to max dimensions and compress, returns data URL
export function resizeImage(
  file: File,
  maxWidth = 256,
  maxHeight = 256,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // For GIFs, just convert to data URL without resize (to preserve animation)
    if (file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read GIF"));
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
