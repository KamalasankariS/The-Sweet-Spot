// Content moderation for profile text and images.
// Screens names, bios, and filenames for inappropriate content.
// Songs are explicitly excluded from moderation per product decision.

// Profanity / slur blocklist — covers common offensive terms and l33t-speak variants.
// This is intentionally comprehensive but not exhaustive; production would use a service.
const BLOCKED_WORDS = [
  "fuck","shit","ass","bitch","damn","cunt","dick","cock","pussy",
  "nigger","nigga","faggot","fag","retard","retarded","whore","slut",
  "bastard","piss","twat","wanker","bollocks","arsehole","asshole",
  "motherfucker","mfer","stfu","gtfo","lmfao","wtf","af",
  "porn","hentai","xxx","nsfw","nude","nudes","naked","sex","sexy",
  "dildo","vibrator","orgasm","blowjob","handjob","cumshot","anal",
  "boob","boobs","tits","titties","penis","vagina","erection",
  "kike","spic","wetback","chink","gook","beaner","cracker",
  "tranny","shemale","dyke",
  "kill","murder","rape","molest","pedophile","pedo",
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

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/[!|]/g, "i")
    .replace(/[*_\-.]/g, "");
}

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export function moderateText(text: string, fieldName: string): ModerationResult {
  if (!text.trim()) return { passed: true };

  const normalized = normalizeText(text);

  // Check each blocked word as a whole-word match in the normalized string
  for (const word of BLOCKED_WORDS) {
    const normalizedWord = normalizeText(word);
    // Word boundary check: look for the word surrounded by non-alpha chars or string edges
    const regex = new RegExp(`(?:^|[^a-z])${escapeRegex(normalizedWord)}(?:[^a-z]|$)`);
    if (regex.test(normalized)) {
      return {
        passed: false,
        reason: `${fieldName} contains inappropriate language. Please keep it clean.`,
      };
    }
  }

  // Check blocked emoji patterns
  for (const pattern of BLOCKED_EMOJI_PATTERNS) {
    if (text.includes(pattern)) {
      return {
        passed: false,
        reason: `${fieldName} contains inappropriate emoji. Please remove it.`,
      };
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
