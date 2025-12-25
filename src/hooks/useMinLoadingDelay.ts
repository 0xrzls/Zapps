import { useEffect, useRef, useState } from "react";

export function useMinLoadingDelay(loading: boolean, minMs: number = 500) {
  const [displayLoading, setDisplayLoading] = useState(loading);
  const startTimeRef = useRef<number | null>(loading ? Date.now() : null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      startTimeRef.current = Date.now();
      setDisplayLoading(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      const now = Date.now();
      const startedAt = startTimeRef.current ?? now;
      const elapsed = now - startedAt;
      const remaining = Math.max(0, minMs - elapsed);

      if (remaining === 0) {
        setDisplayLoading(false);
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setDisplayLoading(false);
          timeoutRef.current = null;
        }, remaining);
      }
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [loading, minMs]);

  return displayLoading;
}