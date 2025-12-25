
import { useState, useEffect, useCallback } from 'react';
import { backend } from '../index';
import type { DApp, QueryOptions } from '../types';

export function useDApps(options?: QueryOptions) {
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDApps = useCallback(async () => {
    setLoading(true);
    const result = await backend.dapps.getAll(options);
    
    if (result.error) {
      setError(result.error);
    } else {
      setDapps(result.data || []);
      setError(null);
    }
    setLoading(false);
  }, [options]);

  useEffect(() => {
    fetchDApps();
  }, [fetchDApps]);

  return { dapps, loading, error, refetch: fetchDApps };
}

export function useDApp(idOrSlug: string, useSlug = true) {
  const [dapp, setDapp] = useState<DApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDApp = async () => {
      setLoading(true);
      const result = useSlug 
        ? await backend.dapps.getBySlug(idOrSlug)
        : await backend.dapps.getById(idOrSlug);
      
      if (result.error) {
        setError(result.error);
      } else {
        setDapp(result.data);
        setError(null);
      }
      setLoading(false);
    };

    if (idOrSlug) {
      fetchDApp();
    }
  }, [idOrSlug, useSlug]);

  return { dapp, loading, error };
}

export function useFeaturedDApps(limit = 10) {
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const result = await backend.dapps.getFeatured(limit);
      
      if (result.error) {
        setError(result.error);
      } else {
        setDapps(result.data || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchFeatured();
  }, [limit]);

  return { dapps, loading, error };
}

export function useSearchDApps(query: string, options?: QueryOptions) {
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setDapps([]);
      return;
    }

    const searchDApps = async () => {
      setLoading(true);
      const result = await backend.dapps.search(query, options);
      
      if (result.error) {
        setError(result.error);
      } else {
        setDapps(result.data || []);
        setError(null);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(searchDApps, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, options]);

  return { dapps, loading, error };
}
