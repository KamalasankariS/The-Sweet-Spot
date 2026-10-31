// ==============================================
// Zipcode / Postal Code Validation
// ==============================================
// Layer 1: Regex format validation per country (instant, offline)
// Layer 2: Geocode existence check via Photon (async, confirms real location)

// Comprehensive postal code regex patterns by ISO 3166-1 alpha-2 country code
// Sources: Universal Postal Union, Wikipedia, official postal services
const POSTAL_PATTERNS: Record<string, RegExp> = {
  // North America
  US: /^\d{5}(-\d{4})?$/,                          // 12345 or 12345-6789
  CA: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/,       // A1A 1A1
  MX: /^\d{5}$/,                                     // 12345

  // Europe
  GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, // SW1A 1AA, M1 1AE, B33 8TH
  DE: /^\d{5}$/,                                     // 12345
  FR: /^\d{5}$/,                                     // 75001
  IT: /^\d{5}$/,                                     // 00100
  ES: /^\d{5}$/,                                     // 28001
  PT: /^\d{4}(-\d{3})?$/,                           // 1000 or 1000-001
  NL: /^\d{4}\s?[A-Za-z]{2}$/,                      // 1234 AB
  BE: /^\d{4}$/,                                     // 1000
  AT: /^\d{4}$/,                                     // 1010
  CH: /^\d{4}$/,                                     // 8001
  SE: /^\d{3}\s?\d{2}$/,                            // 111 22
  NO: /^\d{4}$/,                                     // 0001
  DK: /^\d{4}$/,                                     // 1000
  FI: /^\d{5}$/,                                     // 00100
  PL: /^\d{2}-?\d{3}$/,                             // 00-001
  CZ: /^\d{3}\s?\d{2}$/,                            // 110 00
  SK: /^\d{3}\s?\d{2}$/,                            // 811 01
  HU: /^\d{4}$/,                                     // 1011
  RO: /^\d{6}$/,                                     // 010011
  BG: /^\d{4}$/,                                     // 1000
  HR: /^\d{5}$/,                                     // 10000
  SI: /^\d{4}$/,                                     // 1000
  RS: /^\d{5,6}$/,                                   // 11000
  GR: /^\d{3}\s?\d{2}$/,                            // 104 31
  IE: /^[A-Za-z\d]{3}\s?[A-Za-z\d]{4}$/,            // D02 AF30 (Eircode)
  LU: /^\d{4}$/,                                     // 1009
  LT: /^(LT-)?\d{5}$/i,                             // LT-01001
  LV: /^(LV-)?\d{4}$/i,                             // LV-1001
  EE: /^\d{5}$/,                                     // 10111
  IS: /^\d{3}$/,                                     // 101
  MT: /^[A-Za-z]{3}\s?\d{2,4}$/,                    // VLT 1000
  CY: /^\d{4}$/,                                     // 1010
  AL: /^\d{4}$/,                                     // 1001
  MK: /^\d{4}$/,                                     // 1000
  ME: /^\d{5}$/,                                     // 81000
  BA: /^\d{5}$/,                                     // 71000
  XK: /^\d{5}$/,                                     // 10000
  UA: /^\d{5}$/,                                     // 01001
  BY: /^\d{6}$/,                                     // 220000
  MD: /^(MD-)?\d{4}$/i,                             // MD-2001

  // Russia & Central Asia
  RU: /^\d{6}$/,                                     // 101000
  KZ: /^\d{6}$/,                                     // 010000
  UZ: /^\d{6}$/,                                     // 100000
  KG: /^\d{6}$/,                                     // 720001
  TJ: /^\d{6}$/,                                     // 734001
  TM: /^\d{6}$/,                                     // 744000
  GE: /^\d{4}$/,                                     // 0100
  AM: /^\d{4}$/,                                     // 0001
  AZ: /^(AZ)?\s?\d{4}$/i,                           // AZ 1000

  // Asia
  IN: /^\d{6}$/,                                     // 110001
  CN: /^\d{6}$/,                                     // 100000
  JP: /^\d{3}-?\d{4}$/,                             // 100-0001
  KR: /^\d{5}$/,                                     // 03051
  TW: /^\d{3,5}$/,                                   // 100 or 10044
  HK: /^$/,                                          // No postal code
  MO: /^$/,                                          // No postal code
  SG: /^\d{6}$/,                                     // 018956
  MY: /^\d{5}$/,                                     // 50000
  TH: /^\d{5}$/,                                     // 10200
  VN: /^\d{5,6}$/,                                   // 100000
  PH: /^\d{4}$/,                                     // 1000
  ID: /^\d{5}$/,                                     // 10110
  PK: /^\d{5}$/,                                     // 44000
  BD: /^\d{4}$/,                                     // 1000
  LK: /^\d{5}$/,                                     // 00100
  NP: /^\d{5}$/,                                     // 44600
  MM: /^\d{5}$/,                                     // 11181
  KH: /^\d{5,6}$/,                                   // 12000
  LA: /^\d{5}$/,                                     // 01000
  MN: /^\d{5,6}$/,                                   // 14200
  BN: /^[A-Za-z]{2}\d{4}$/,                         // BT1728
  MV: /^\d{5}$/,                                     // 20026
  BT: /^\d{5}$/,                                     // 11001

  // Middle East
  IL: /^\d{5,7}$/,                                   // 6100000
  SA: /^\d{5}(-\d{4})?$/,                           // 11564
  AE: /^$/,                                          // No postal code
  QA: /^$/,                                          // No postal code
  KW: /^\d{5}$/,                                     // 13001
  BH: /^\d{3,4}$/,                                   // 1234
  OM: /^\d{3}$/,                                     // 100
  JO: /^\d{5}$/,                                     // 11110
  LB: /^\d{4}\s?\d{4}$/,                            // 1100 2010
  IQ: /^\d{5}$/,                                     // 10001
  IR: /^\d{5}-?\d{5}$/,                             // 11365-44541
  TR: /^\d{5}$/,                                     // 06420
  YE: /^$/,                                          // No standard

  // Africa
  ZA: /^\d{4}$/,                                     // 0001
  NG: /^\d{6}$/,                                     // 100001
  EG: /^\d{5}$/,                                     // 11511
  KE: /^\d{5}$/,                                     // 00100
  ET: /^\d{4}$/,                                     // 1000
  TZ: /^\d{5}$/,                                     // 11101
  MA: /^\d{5}$/,                                     // 10000
  TN: /^\d{4}$/,                                     // 1000
  DZ: /^\d{5}$/,                                     // 16000
  GH: /^[A-Za-z]{2}-?\d{3,4}-?\d{4}$/,              // GA-184-5765
  SN: /^\d{5}$/,                                     // 10000
  CI: /^\d{2}\s?BP\s?\d+$/i,                        // Irregular
  CM: /^\d{5}$/,                                     // 00237
  UG: /^\d{5,6}$/,                                   // Kampala uses none widely
  MU: /^\d{5}$/,                                     // 11101
  MG: /^\d{3}$/,                                     // 101
  ZW: /^$/,                                          // No postal code

  // Oceania
  AU: /^\d{4}$/,                                     // 2000
  NZ: /^\d{4}$/,                                     // 6011
  FJ: /^$/,                                          // No postal code
  PG: /^\d{3}$/,                                     // 111

  // South America
  BR: /^\d{5}-?\d{3}$/,                             // 01001-000
  AR: /^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/,              // C1420 or 1420
  CL: /^\d{7}$/,                                     // 8320000
  CO: /^\d{6}$/,                                     // 110111
  PE: /^\d{5}$/,                                     // 15001
  VE: /^\d{4}(-?[A-Za-z])?\s?$/,                    // 1010 or 1010-A
  EC: /^\d{6}$/,                                     // 170150
  UY: /^\d{5}$/,                                     // 11000
  PY: /^\d{4}$/,                                     // 1209
  BO: /^\d{4}$/,                                     // 0001
  GY: /^$/,                                          // No postal code
  SR: /^$/,                                          // No postal code

  // Caribbean & Central America
  PR: /^\d{5}(-\d{4})?$/,                           // 00901 (US territory)
  CU: /^\d{5}$/,                                     // 10100
  DO: /^\d{5}$/,                                     // 10101
  JM: /^\d{2}$/,                                     // 01
  TT: /^\d{6}$/,                                     // 120110
  CR: /^\d{4,5}$/,                                   // 10101
  PA: /^\d{4}$/,                                     // 0801
  GT: /^\d{5}$/,                                     // 01001
  HN: /^\d{5}$/,                                     // 11101
  SV: /^\d{4}$/,                                     // 1101
  NI: /^\d{5}$/,                                     // 11001
  BZ: /^$/,                                          // No postal code
};

// Countries that don't use postal codes — skip validation entirely
const NO_POSTAL_CODE = new Set([
  "HK", "MO", "AE", "QA", "YE", "ZW", "FJ", "GY", "SR", "BZ",
  "AG", "AI", "AO", "AW", "BB", "BI", "BJ", "BS", "BW", "CD",
  "CF", "CG", "CK", "DJ", "DM", "ER", "GA", "GD", "GM", "GN",
  "GQ", "KI", "KM", "KN", "LC", "LR", "LY", "ML", "MR", "MW",
  "NA", "NE", "NR", "RW", "SC", "SL", "SO", "SS", "ST", "SY",
  "TC", "TD", "TG", "TL", "TO", "TV", "VC", "VG", "VI", "VU",
  "WS",
]);

export interface ZipcodeValidation {
  valid: boolean;
  formatOk: boolean;
  exists: boolean | null; // null = not checked yet
  message: string;
  coords?: { lat: number; lon: number };
}

/**
 * Layer 1: Check if the zipcode matches the expected format for the country.
 */
export function validateZipcodeFormat(
  zipcode: string,
  countryCode: string
): { valid: boolean; message: string } {
  const cc = countryCode.toUpperCase();
  const z = zipcode.trim();

  if (NO_POSTAL_CODE.has(cc)) {
    return { valid: true, message: "This country does not use postal codes" };
  }

  if (!z) {
    return { valid: false, message: "Postal code is required" };
  }

  const pattern = POSTAL_PATTERNS[cc];
  if (!pattern) {
    // Unknown country — accept anything non-empty as we can't validate format
    return { valid: z.length >= 2, message: z.length >= 2 ? "" : "Enter a valid postal code" };
  }

  // Empty regex means no postal code system
  if (pattern.source === "^$") {
    return { valid: true, message: "" };
  }

  if (pattern.test(z)) {
    return { valid: true, message: "" };
  }

  // Generate human-friendly format hint
  const hints: Record<string, string> = {
    US: "12345 or 12345-6789",
    CA: "A1A 1A1",
    GB: "SW1A 1AA",
    DE: "12345",
    FR: "75001",
    IN: "110001 (6 digits)",
    JP: "100-0001",
    AU: "2000 (4 digits)",
    BR: "01001-000",
    NL: "1234 AB",
    CN: "100000 (6 digits)",
    KR: "03051 (5 digits)",
    IT: "00100",
    ES: "28001",
    RU: "101000 (6 digits)",
    PL: "00-001",
    SE: "111 22",
    NZ: "6011 (4 digits)",
    ZA: "0001 (4 digits)",
    SG: "018956 (6 digits)",
    MY: "50000 (5 digits)",
    TH: "10200 (5 digits)",
    PH: "1000 (4 digits)",
    ID: "10110 (5 digits)",
    MX: "12345",
    AR: "C1420",
    CL: "8320000 (7 digits)",
    CO: "110111 (6 digits)",
    TR: "06420 (5 digits)",
    PK: "44000 (5 digits)",
    BD: "1000 (4 digits)",
    EG: "11511 (5 digits)",
    NG: "100001 (6 digits)",
    KE: "00100 (5 digits)",
    IL: "6100000",
    SA: "11564",
    IE: "D02 AF30",
    PT: "1000-001",
    CH: "8001 (4 digits)",
    AT: "1010 (4 digits)",
    BE: "1000 (4 digits)",
  };

  const hint = hints[cc];
  return {
    valid: false,
    message: hint ? `Invalid format — expected: ${hint}` : "Invalid postal code format",
  };
}

/**
 * Layer 2: Verify the zipcode exists via Photon geocoding.
 * Confirms it resolves to a real place, optionally in the expected country/state/city.
 */
export async function verifyZipcodeExists(
  zipcode: string,
  countryCode: string,
  expectedState?: string,
  expectedCity?: string
): Promise<{
  exists: boolean;
  message: string;
  resolvedCity?: string;
  resolvedState?: string;
  coords?: { lat: number; lon: number };
}> {
  const z = zipcode.trim();
  const cc = countryCode.toUpperCase();

  if (NO_POSTAL_CODE.has(cc) || !z) {
    return { exists: true, message: "" };
  }

  try {
    const params = new URLSearchParams({ q: z, limit: "5" });
    const res = await fetch(`https://photon.komoot.io/api/?${params}`);
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = data.features || [];

    // Find a feature that matches the country
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = features.find((f: any) => {
      const fcc = (f.properties?.countrycode || "").toUpperCase();
      return fcc === cc;
    });

    if (!match) {
      return {
        exists: false,
        message: "This postal code was not found — please double-check",
      };
    }

    const props = match.properties || {};
    const coords = match.geometry?.coordinates;
    const resolvedState = props.state || "";
    const resolvedCity = props.city || props.name || "";
    const result = {
      exists: true,
      message: "",
      resolvedCity,
      resolvedState,
      coords: coords ? { lat: coords[1], lon: coords[0] } : undefined,
    };

    // Warn if the zipcode is in a different state than expected
    if (expectedState && resolvedState) {
      const es = expectedState.toLowerCase();
      const rs = resolvedState.toLowerCase();
      if (!rs.includes(es) && !es.includes(rs)) {
        result.message = `This postal code is in ${resolvedState}, not ${expectedState}`;
        result.exists = false;
        return result;
      }
    }

    // Warn if zipcode is in a different city than expected
    if (expectedCity && resolvedCity) {
      const ec = expectedCity.toLowerCase();
      const rc = resolvedCity.toLowerCase();
      if (!rc.includes(ec) && !ec.includes(rc)) {
        // Soft warning — don't block, neighboring cities share zips
        result.message = `This postal code resolves to ${resolvedCity}`;
      }
    }

    return result;
  } catch {
    // Network error — don't block the user, format check is enough
    return { exists: true, message: "" };
  }
}

/**
 * Combined validation: format + existence.
 */
export async function validateZipcode(
  zipcode: string,
  countryCode: string,
  expectedState?: string,
  expectedCity?: string
): Promise<ZipcodeValidation> {
  const cc = countryCode.toUpperCase();

  if (NO_POSTAL_CODE.has(cc)) {
    return { valid: true, formatOk: true, exists: true, message: "" };
  }

  // Layer 1: Format
  const fmt = validateZipcodeFormat(zipcode, countryCode);
  if (!fmt.valid) {
    return { valid: false, formatOk: false, exists: null, message: fmt.message };
  }

  // Layer 2: Existence
  const geo = await verifyZipcodeExists(zipcode, countryCode, expectedState, expectedCity);
  return {
    valid: geo.exists,
    formatOk: true,
    exists: geo.exists,
    message: geo.message,
    coords: geo.coords,
  };
}

/**
 * Check if a country uses postal codes.
 */
export function countryUsesPostalCode(countryCode: string): boolean {
  return !NO_POSTAL_CODE.has(countryCode.toUpperCase());
}
