
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ZAPPS_ADDRESSES } from '@/lib/contracts/zappsContracts';

const REPUTATION_ABI = [
  'function getUserInfo(address user) view returns (uint256 lastUpdate, uint256 lastDecayTime, bool initialized)',
  'function getReputationLevels() view returns (tuple(string name, uint256 minScore, uint256 maxScore)[])',
  'function owner() view returns (address)',
];

export interface ReputationInfo {
  lastUpdate: number;
  lastDecayTime: number;
  initialized: boolean;
  level: string;
  displayScore: number;
}

export interface ReputationLevel {
  name: string;
  minScore: number;
  maxScore: number;
}

const DEFAULT_LEVELS: ReputationLevel[] = [
  { name: 'Newcomer', minScore: 0, maxScore: 99 },
  { name: 'Explorer', minScore: 100, maxScore: 499 },
  { name: 'Contributor', minScore: 500, maxScore: 999 },
  { name: 'Expert', minScore: 1000, maxScore: 4999 },
  { name: 'Legend', minScore: 5000, maxScore: 999999 },
];

const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

export function useOnChainReputation(userAddress: string | undefined) {
  const [reputation, setReputation] = useState<ReputationInfo | null>(null);
  const [levels, setLevels] = useState<ReputationLevel[]>(DEFAULT_LEVELS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(SEPOLIA_RPC);
  }, []);

  const getContract = useCallback(() => {
    const provider = getProvider();
    return new ethers.Contract(
      ZAPPS_ADDRESSES.REPUTATION,
      REPUTATION_ABI,
      provider
    );
  }, [getProvider]);

  const fetchReputation = useCallback(async (): Promise<ReputationInfo | null> => {
    if (!userAddress) return null;

    setLoading(true);
    setError(null);

    try {
      const contract = getContract();
      
      const userInfo = await contract.getUserInfo(userAddress);
      
      const displayScore = userInfo.initialized ? 100 : 0;
      
      const level = levels.find(
        l => displayScore >= l.minScore && displayScore <= l.maxScore
      )?.name || 'Newcomer';

      const info: ReputationInfo = {
        lastUpdate: Number(userInfo.lastUpdate || 0),
        lastDecayTime: Number(userInfo.lastDecayTime || 0),
        initialized: userInfo.initialized || false,
        level,
        displayScore,
      };

      setReputation(info);
      return info;
    } catch (err) {
      console.error('[useOnChainReputation] Failed to fetch reputation:', err);
      setError(err as Error);
      
      const defaultInfo: ReputationInfo = {
        lastUpdate: 0,
        lastDecayTime: 0,
        initialized: false,
        level: 'Newcomer',
        displayScore: 0,
      };
      setReputation(defaultInfo);
      return defaultInfo;
    } finally {
      setLoading(false);
    }
  }, [userAddress, getContract, levels]);

  const fetchLevels = useCallback(async () => {
    try {
      const contract = getContract();
      const contractLevels = await contract.getReputationLevels();
      
      if (contractLevels && contractLevels.length > 0) {
        const parsedLevels: ReputationLevel[] = contractLevels.map((l: any) => ({
          name: l.name,
          minScore: Number(l.minScore),
          maxScore: Number(l.maxScore),
        }));
        setLevels(parsedLevels);
      }
    } catch (err) {
      console.warn('[useOnChainReputation] Using default levels:', err);
      
    }
  }, [getContract]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  useEffect(() => {
    if (userAddress) {
      fetchReputation();
    }
  }, [userAddress, fetchReputation]);

  return {
    reputation,
    levels,
    loading,
    error,
    refresh: fetchReputation,
  };
}
