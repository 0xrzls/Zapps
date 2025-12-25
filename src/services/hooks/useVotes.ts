
import { useState, useEffect, useCallback } from 'react';
import { backend } from '../index';
import type { DAppVote } from '../types';

export function useVotes(dappId: string) {
  const [votes, setVotes] = useState<DAppVote[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVotes = useCallback(async () => {
    if (!dappId) return;
    
    setLoading(true);
    const [votesResult, totalResult] = await Promise.all([
      backend.votes.getByDApp(dappId),
      backend.votes.getTotalForDApp(dappId),
    ]);
    
    if (votesResult.error) {
      setError(votesResult.error);
    } else {
      setVotes(votesResult.data || []);
      setTotalVotes(totalResult.data || 0);
      setError(null);
    }
    setLoading(false);
  }, [dappId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return { votes, totalVotes, loading, error, refetch: fetchVotes };
}

export function useUserVote(userId: string, dappId: string) {
  const [vote, setVote] = useState<DAppVote | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserVote = async () => {
      if (!userId || !dappId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const result = await backend.votes.getUserVoteForDApp(userId, dappId);
      
      if (result.error) {
        setError(result.error);
      } else {
        setVote(result.data);
        setHasVoted(!!result.data);
        setError(null);
      }
      setLoading(false);
    };

    fetchUserVote();
  }, [userId, dappId]);

  const submitVote = useCallback(async (voteData: Partial<DAppVote>) => {
    const result = await backend.votes.create({
      ...voteData,
      user_id: userId,
      dapp_id: dappId,
    });
    
    if (!result.error && result.data) {
      setVote(result.data);
      setHasVoted(true);
    }
    
    return result;
  }, [userId, dappId]);

  return { vote, hasVoted, loading, error, submitVote };
}
