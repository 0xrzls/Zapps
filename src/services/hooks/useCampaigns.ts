
import { useState, useEffect, useCallback } from 'react';
import { backend } from '../index';
import type { Campaign, QueryOptions } from '../types';

export function useCampaigns(options?: QueryOptions) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const result = await backend.campaigns.getAll(options);
    
    if (result.error) {
      setError(result.error);
    } else {
      setCampaigns(result.data || []);
      setError(null);
    }
    setLoading(false);
  }, [options]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, refetch: fetchCampaigns };
}

export function useCampaign(id: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      const result = await backend.campaigns.getById(id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCampaign(result.data);
        setError(null);
      }
      setLoading(false);
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  return { campaign, loading, error };
}

export function useActiveCampaigns(options?: QueryOptions) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActive = async () => {
      setLoading(true);
      const result = await backend.campaigns.getActive(options);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCampaigns(result.data || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchActive();
  }, [options]);

  return { campaigns, loading, error };
}

export function useFeaturedCampaigns(limit = 10) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const result = await backend.campaigns.getFeatured(limit);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCampaigns(result.data || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchFeatured();
  }, [limit]);

  return { campaigns, loading, error };
}
