"use client";

import { IconPin } from "@/components/icons/SweetSpotIcons";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
    county?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

interface SuggestionItem {
  id: string;
  primary: string;
  secondary: string;
  postcode?: string;
  display: string;
  raw: PhotonFeature;
}

interface LocationAutocompleteProps {
  value: string;
  zipcode: string;
  onChange: (v: string) => void;
  onZipcodeChange: (v: string) => void;
  onVerifiedChange?: (verified: boolean) => void;
  variant?: "default" | "compact";
  /** ISO 3166-1 alpha-2 country code to constrain results (e.g. "us", "gb") */
  countryCode?: string;
  /** Custom placeholder for the main input */
  placeholder?: string;
  /** Hide zip code field and GPS button (for use as a simple location picker) */
  minimal?: boolean;
}

export function LocationAutocomplete({
  value,
  zipcode,
  onChange,
  onZipcodeChange,
  onVerifiedChange,
  variant = "default",
  countryCode,
  placeholder: customPlaceholder,
  minimal = false,
}: LocationAutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [verified, setVerified] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [zipFocused, setZipFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const zipDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const markVerified = useCallback((v: boolean) => {
    setVerified(v);
    onVerifiedChange?.(v);
  }, [onVerifiedChange]);

  useEffect(() => {
    if (value && value !== searchText && !focused) {
      setSearchText(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
        setZipFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Convert Photon feature to our SuggestionItem
  const photonToSuggestion = useCallback((f: PhotonFeature): SuggestionItem | null => {
    const p = f.properties;
    const city = p.city || p.county || "";
    const state = p.state || "";
    if (!city && !state) return null;

    const street = p.street ? `${p.housenumber ? p.housenumber + " " : ""}${p.street}` : "";
    const district = p.district || "";
    const isUS = (p.countrycode || "").toLowerCase() === "us";
    const country = !isUS ? (p.country || "") : "";

    const parts: string[] = [];
    if (street) parts.push(street);
    else if (p.name && p.name !== city) parts.push(p.name);
    else if (district) parts.push(district);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);

    const display = parts.join(", ");
    const primary = street || p.name || district || city;
    const secondaryParts = [street ? (district || city) : city, state, country].filter(Boolean);

    return {
      id: `${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}-${p.osm_id || Math.random()}`,
      primary,
      secondary: secondaryParts.join(", "),
      postcode: p.postcode,
      display,
      raw: f,
    };
  }, []);

  // Fetch + filter helper shared by address and zip search
  const fetchAndFilter = useCallback(async (query: string, limit: string): Promise<SuggestionItem[]> => {
    const params = new URLSearchParams({ q: query, limit });
    const res = await fetch(`https://photon.komoot.io/api/?${params}`);
    const data = await res.json();
    let features: PhotonFeature[] = data.features || [];
    // Filter by country code if specified (Photon returns uppercase codes like "US")
    if (countryCode) {
      const cc = countryCode.toUpperCase();
      features = features.filter((f) => (f.properties.countrycode || "").toUpperCase() === cc);
    }
    const items = features.map(photonToSuggestion).filter(Boolean) as SuggestionItem[];
    // Deduplicate by display string
    const seen = new Set<string>();
    return items.filter((s) => {
      const key = s.display.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [countryCode, photonToSuggestion]);

  // Photon-based fuzzy search (typo-tolerant)
  const searchAddress = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Request more results when filtering by country (some may be filtered out)
        const limit = countryCode ? "20" : "8";
        const unique = await fetchAndFilter(query.trim(), limit);
        setSuggestions(unique.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 200);
  }, [countryCode, fetchAndFilter]);

  // Search by zip code
  const searchByZip = useCallback((zip: string) => {
    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    if (!zip.trim() || zip.length < 3) {
      setSuggestions([]);
      return;
    }

    zipDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const limit = countryCode ? "20" : "8";
        const unique = await fetchAndFilter(zip.trim(), limit);
        setSuggestions(unique.slice(0, 6));
        setFocused(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [countryCode, fetchAndFilter]);

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: "json",
        addressdetails: "1",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        { headers: { "User-Agent": "TheSweetSpot/1.0" } }
      );
      const data: NominatimResult = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (result?.address) {
          const addr = result.address;
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          const road = addr.road || addr.neighbourhood || addr.suburb || "";
          const country = addr.country_code !== "us" ? (addr.country || "") : "";
          const displayParts = [road, city, state, country].filter(Boolean);
          const display = displayParts.join(", ");
          onChange(display);
          setSearchText(display);
          markVerified(true);
          if (addr.postcode) onZipcodeChange(addr.postcode);
        }
        setLocating(false);
        setFocused(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location access denied");
        } else {
          setLocationError("Could not get location");
        }
        setTimeout(() => setLocationError(""), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange, onZipcodeChange, reverseGeocode, markVerified]);

  const handleInputChange = (v: string) => {
    setSearchText(v);
    if (verified) {
      markVerified(false);
      onChange("");
      onZipcodeChange("");
    }
    searchAddress(v);
  };

  const handleZipcodeChange = (v: string) => {
    // Allow only alphanumeric, spaces, and hyphens (for international postal codes)
    const clean = v.replace(/[^a-zA-Z0-9\s-]/g, "");
    onZipcodeChange(clean);
    if (verified) {
      markVerified(false);
      onChange("");
      setSearchText("");
    }
    searchByZip(clean);
  };

  const selectSuggestion = (item: SuggestionItem) => {
    onChange(item.display);
    setSearchText(item.display);
    if (item.postcode) onZipcodeChange(item.postcode);
    markVerified(true);
    setFocused(false);
    setZipFocused(false);
    setSuggestions([]);
  };

  const isCompact = variant === "compact";

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "stretch" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={customPlaceholder || "Address, city, neighborhood, or zip..."}
            style={{
              width: "100%",
              padding: isCompact ? "0.6rem 0.75rem 0.6rem 2rem" : "0.75rem 0.75rem 0.75rem 2.25rem",
              paddingRight: verified ? "2rem" : undefined,
              borderRadius: isCompact ? "0.75rem" : "0.5rem",
              background: "white",
              border: `1px solid ${verified ? "rgba(34,197,94,0.3)" : focused ? "rgba(232,120,138,0.4)" : "rgba(232,224,214,0.6)"}`,
              color: "#2D2A26",
              fontSize: isCompact ? "0.8rem" : "0.85rem",
              outline: "none",
              transition: "border-color 0.15s",
            }}
          />
          <span style={{
            position: "absolute", left: isCompact ? "0.6rem" : "0.75rem",
            top: "50%", transform: "translateY(-50%)",
            fontSize: "0.8rem", opacity: 0.3, pointerEvents: "none",
          }}>
            <IconPin size={14} />
          </span>
          {verified && (
            <span style={{
              position: "absolute", right: "0.6rem",
              top: "50%", transform: "translateY(-50%)",
              fontSize: "0.75rem", color: "rgba(34,197,94,0.8)", pointerEvents: "none",
            }}>
              Done
            </span>
          )}
        </div>

        {!minimal && (
          <input
            type="text"
            value={zipcode}
            onChange={(e) => handleZipcodeChange(e.target.value)}
            onFocus={() => { setZipFocused(true); setFocused(true); }}
            placeholder="Zip"
            title="Enter zip/postal code to search"
            style={{
              width: isCompact ? "4.5rem" : "5rem",
              padding: isCompact ? "0.6rem 0.375rem" : "0.75rem 0.375rem",
              borderRadius: isCompact ? "0.75rem" : "0.5rem",
              background: "white",
              border: `1px solid ${zipcode && verified ? "rgba(34,197,94,0.3)" : zipFocused ? "rgba(232,120,138,0.4)" : "rgba(232,224,214,0.5)"}`,
              color: "rgba(45,42,38,0.8)",
              fontSize: isCompact ? "0.8rem" : "0.85rem",
              outline: "none",
              textAlign: "center",
              fontFamily: "monospace",
              cursor: "text",
              transition: "border-color 0.15s",
            }}
          />
        )}
      </div>

      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute", top: "calc(100% + 0.375rem)", left: 0, right: 0, zIndex: 30,
              background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(232,224,214,0.6)", borderRadius: "0.75rem",
              overflow: "hidden", maxHeight: "16rem", overflowY: "auto",
              boxShadow: "0 4px 16px rgba(45,42,38,0.08)",
            }}
          >
            {!minimal && (
              <button
                onMouseDown={(e) => { e.preventDefault(); useCurrentLocation(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.7rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(232,224,214,0.4)", color: "#2D2A26",
                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.06)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                  background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.8rem", flexShrink: 0,
                }}>
                  {locating ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      ◌
                    </motion.span>
                  ) : "\u2B06"}
                </span>
                <div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "rgba(59,130,246,0.9)" }}>
                    {locating ? "Getting location..." : "Current Location"}
                  </span>
                  {locationError && (
                    <span style={{ display: "block", fontSize: "0.65rem", color: "rgba(239,68,68,0.7)" }}>
                      {locationError}
                    </span>
                  )}
                </div>
              </button>
            )}

            {searching && suggestions.length === 0 && (
              <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(45,42,38,0.25)", fontSize: "0.75rem" }}>
                Searching...
              </div>
            )}

            {suggestions.map((item) => (
              <button
                key={item.id}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(item); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(232,224,214,0.3)", color: "#2D2A26",
                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.03)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                  background: "rgba(45,42,38,0.04)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, color: "rgba(45,42,38,0.35)",
                }}>
                  <IconPin size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.primary}
                  </div>
                  {item.secondary && (
                    <div style={{ fontSize: "0.7rem", color: "rgba(45,42,38,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.secondary}
                    </div>
                  )}
                </div>
                {item.postcode && (
                  <span style={{ fontSize: "0.65rem", color: "rgba(45,42,38,0.2)", fontFamily: "monospace", flexShrink: 0 }}>
                    {item.postcode}
                  </span>
                )}
              </button>
            ))}

            {!searching && suggestions.length === 0 && searchText.length < 2 && (
              <div style={{ padding: "0.6rem 0.75rem", color: "rgba(45,42,38,0.25)", fontSize: "0.75rem" }}>
                Start typing an address, city, or zip code...
              </div>
            )}

            {!searching && suggestions.length === 0 && searchText.length >= 2 && (
              <div style={{ padding: "0.6rem 0.75rem", color: "rgba(45,42,38,0.25)", fontSize: "0.75rem" }}>
                No results found. Try a slightly different spelling.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
