import { useEffect, useState } from "react";
import FetchCache from "../utils/fetchCache";

type Status = "idle" | "loading" | "success" | "error";

const globalCache = new FetchCache();

export const fetchCache = {
  clear: () => globalCache.clear(),
};

export function useFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts?: {
    enabled?: boolean;
    ttl?: number; // ms
  },
) {
  const { enabled = true, ttl = 0 } = opts ?? {};

  // Get cached data from global cache
  const getCachedData = (): T | null => {
    return globalCache.get<T>(key, ttl || undefined);
  };

  const hasCachedData = () => {
    return globalCache.has(key, ttl || undefined);
  };

  // Check if there's an active fetch for this key (dedupe concurrent requests)
  const getActiveFetch = (): Promise<T> | undefined => {
    return globalCache.getActiveFetch<T>(key);
  };

  const cachedData = getCachedData();
  const [data, setData] = useState<T | null>(cachedData);
  const [error, setError] = useState<unknown>(null);
  // If we have cached data, start with success status to avoid showing loader
  const [status, setStatus] = useState<Status>(cachedData ? "success" : "idle");

  const refetch = async () => {
    // ALWAYS check cache first - never show loading if we have valid cached data
    const cached = getCachedData();
    if (cached) {
      // Already have valid cached data, ensure state is correct
      setData(cached);
      setStatus("success");
      return cached;
    }

    // Check if there's already an active fetch for this key (dedupe)
    const activeFetch = getActiveFetch();
    if (activeFetch) {
      try {
        const res = await activeFetch;
        setData(res);
        setStatus("success");
        return res;
      } catch (e) {
        setError(e);
        setStatus("error");
        throw e;
      }
    }

    // Only set loading if we actually need to fetch
    setStatus("loading");
    setError(null);

    try {
      // Create fetch promise and store it for deduplication
      const fetchPromise = fetcher();
      globalCache.setActiveFetch(key, fetchPromise);

      const res = await fetchPromise;
      globalCache.set(key, res);
      setData(res);
      setStatus("success");
      return res;
    } catch (e) {
      setError(e);
      setStatus("error");
      throw e;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const cached = getCachedData();

    if (cached) {
      setData(cached);
      setStatus("success");
      return;
    }

    const activeFetch = getActiveFetch();
    if (activeFetch) {
      setStatus("loading");
      activeFetch
        .then((res) => {
          setData(res);
          setStatus("success");
        })
        .catch((e) => {
          setError(e);
          setStatus("error");
        });
      return;
    }

    if (status !== "loading" && status !== "success") {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const hasValidCache = hasCachedData();
  const isLoading = status === "loading" && !hasValidCache;

  return {
    data,
    error,
    status,
    isIdle: status === "idle",
    isLoading,
    isSuccess: status === "success",
    isError: status === "error",
    refetch,
  };
}
