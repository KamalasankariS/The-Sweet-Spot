"use client";

import { useState, useCallback, useRef } from "react";
import type { QlooEntity } from "@/types";

export function useQlooSearch(entityType?: string) {
  const [results, setResults] = useState<QlooEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({ q: query, take: "6" });
          if (entityType) params.set("types", entityType);

          const res = await fetch(`/api/qloo/search?${params}`);
          const data = await res.json();
          setResults(data.results || []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [entityType]
  );

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}
