
import { useState, useEffect, useCallback } from 'react';
import { backend } from '../index';
import type { DApp } from '../types';

interface HotDAppsResult {
  dapps: DApp[];
  voteCounts: Record<string, number>;
  ratingAverages: Record<string, number>;
  scoresById: Record<string, number>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useHotDApps(limit = 5): HotDAppsResult {
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [ratingAverages, setRatingAverages] = useState<Record<string, number>>({});
  const [scoresById, setScoresById] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHotDApps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      
      const result = await backend.dapps.getAll({
        filters: { badge: 'Hot' },
        limit,
      });

      if (result.error) throw result.error;
      
      const hotDApps = result.data || [];
      setDapps(hotDApps);

      if (hotDApps.length === 0) {
        setLoading(false);
        return;
      }

      const ids = hotDApps.map((d) => d.id);
      const voteResults = await Promise.all(
        ids.map((id) => backend.votes.getByDApp(id))
      );

      const counts: Record<string, number> = {};
      const sums: Record<string, number> = {};
      const numRatings: Record<string, number> = {};

      voteResults.forEach((voteResult, index) => {
        const dappId = ids[index];
        const votes = voteResult.data || [];
        
        votes.forEach((v) => {
          counts[dappId] = (counts[dappId] || 0) + (v.vote_amount || 0);
          if (v.rating !== null && v.rating !== undefined) {
            const r = Number(v.rating);
            if (!isNaN(r) && r > 0) {
              sums[dappId] = (sums[dappId] || 0) + r;
              numRatings[dappId] = (numRatings[dappId] || 0) + 1;
            }
          }
        });
      });

      setVoteCounts(counts);

      const avg: Record<string, number> = {};
      Object.keys(sums).forEach((id) => {
        const c = numRatings[id] || 0;
        avg[id] = c > 0 ? sums[id] / c : 0;
      });
      setRatingAverages(avg);

      const scoreResults = await Promise.all(
        ids.map((id) => backend.scores.getByDApp(id))
      );

      const scoreMap: Record<string, number> = {};
      scoreResults.forEach((scoreResult, index) => {
        const dappId = ids[index];
        if (scoreResult.data) {
          const v = Number(scoreResult.data.vote_score || 0);
          scoreMap[dappId] = v > 5 ? v / 2 : v;
        }
      });
      setScoresById(scoreMap);

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHotDApps();
  }, [fetchHotDApps]);

  return {
    dapps,
    voteCounts,
    ratingAverages,
    scoresById,
    loading,
    error,
    refetch: fetchHotDApps,
  };
}
