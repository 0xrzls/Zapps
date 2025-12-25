
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

const VOTING_ABI = [
  'function getTargetData(bytes32 targetId) view returns (uint8 targetType, uint32 sum, uint32 count, uint256 average, uint256 totalVotes, uint256 uniqueVoters, uint256 lastUpdate)',
  'function getAverageRating(bytes32 targetId) view returns (uint256)',
  'function getUserVoteInfo(bytes32 targetId, address user) view returns (uint8 voteCount, uint256[] timestamps, bool canVote)',
  'function targets(bytes32) view returns (uint8 targetType, bytes32 encSum, bytes32 encCount, uint32 decSum, uint32 decCount, uint256 lastDecryptTime, bool exists, uint256 createdAt, uint256 totalVotes, uint256 lastVoteTime)',
  'function MAX_RATING() view returns (uint8)',
  'function MIN_RATING() view returns (uint8)',
  'function MAX_VOTES_PER_TARGET() view returns (uint8)',
  'function votePrice() view returns (uint64)',
];

const VOTING_CONTRACT = '0x753845153876736B50741EDFA584fF97fBECbd50';
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

function uuidToBytes32(uuid: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(uuid));
}

export interface OnChainRating {
  average: number;           
  totalVotes: number;        
  uniqueVoters: number;      
  decryptedSum: number;      
  decryptedCount: number;    
  lastUpdate: number;        
  lastDecryptTime: number;   
  pendingDecryption: number; 
  exists: boolean;           
}

export interface UserVoteInfo {
  voteCount: number;
  timestamps: number[];
  canVote: boolean;
}

export function useOnChainVoting(dappId: string | undefined) {
  const { network, address, isConnected } = useWallet();
  const [rating, setRating] = useState<OnChainRating | null>(null);
  const [userVoteInfo, setUserVoteInfo] = useState<UserVoteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSupported = network === 'sepolia';

  const getProvider = useCallback(() => {
    
    return new ethers.JsonRpcProvider(SEPOLIA_RPC);
  }, []);

  const getContract = useCallback(() => {
    const provider = getProvider();
    return new ethers.Contract(VOTING_CONTRACT, VOTING_ABI, provider);
  }, [getProvider]);

  const fetchRating = useCallback(async (forceRefresh = false): Promise<OnChainRating | null> => {
    if (!dappId || !isSupported) return null;

    const cacheKey = `onchain_rating_v2_${dappId}`;
    
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          const age = Date.now() - data.timestamp;
          
          if (age < 60 * 1000) {
            setRating(data.rating);
            return data.rating;
          }
        }
      } catch {}
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getContract();
      const targetId = uuidToBytes32(dappId);
      
      try {
        
        const result = await contract.targets(targetId);
        
        const exists = result.exists;
        const totalVotes = Number(result.totalVotes);
        const decryptedSum = Number(result.decSum);
        const decryptedCount = Number(result.decCount);
        const lastDecryptTime = Number(result.lastDecryptTime);
        
        const average = decryptedCount > 0 ? decryptedSum / decryptedCount : 0;
        
        const pendingDecryption = totalVotes - decryptedCount;

        const ratingData: OnChainRating = {
          average,
          totalVotes,
          uniqueVoters: 0, 
          decryptedSum,
          decryptedCount,
          lastUpdate: Number(result.lastVoteTime),
          lastDecryptTime,
          pendingDecryption,
          exists,
        };

        try {
          const targetData = await contract.getTargetData(targetId);
          ratingData.uniqueVoters = Number(targetData.uniqueVoters);
        } catch {}

        setRating(ratingData);
        
        localStorage.setItem(cacheKey, JSON.stringify({
          rating: ratingData,
          timestamp: Date.now(),
        }));

        return ratingData;
      } catch (err: any) {
        
        const reason = err?.reason || err?.message || '';
        if (reason.includes('TargetNotExists') || err?.revert?.name === 'TargetNotExists') {
          const emptyRating: OnChainRating = {
            average: 0,
            totalVotes: 0,
            uniqueVoters: 0,
            decryptedSum: 0,
            decryptedCount: 0,
            lastUpdate: 0,
            lastDecryptTime: 0,
            pendingDecryption: 0,
            exists: false,
          };
          setRating(emptyRating);
          return emptyRating;
        }
        throw err;
      }
    } catch (err) {
      console.error('[useOnChainVoting] Failed to fetch rating:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [dappId, isSupported, getContract]);

  const fetchUserVoteInfo = useCallback(async (): Promise<UserVoteInfo | null> => {
    if (!dappId || !isSupported || !address) return null;

    try {
      const contract = getContract();
      const targetId = uuidToBytes32(dappId);
      
      try {
        const result = await contract.getUserVoteInfo(targetId, address);
        
        const info: UserVoteInfo = {
          voteCount: Number(result.voteCount),
          timestamps: result.timestamps.map((t: bigint) => Number(t)),
          canVote: result.canVote,
        };

        setUserVoteInfo(info);
        return info;
      } catch (err: any) {
        
        const reason = err?.reason || err?.message || '';
        if (reason.includes('TargetNotExists') || err?.revert?.name === 'TargetNotExists') {
          const info: UserVoteInfo = {
            voteCount: 0,
            timestamps: [],
            canVote: true,
          };
          setUserVoteInfo(info);
          return info;
        }
        throw err;
      }
    } catch (err) {
      console.error('[useOnChainVoting] Failed to fetch user vote info:', err);
      return null;
    }
  }, [dappId, isSupported, address, getContract]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchRating(true),
      fetchUserVoteInfo(),
    ]);
  }, [fetchRating, fetchUserVoteInfo]);

  useEffect(() => {
    if (dappId && isSupported) {
      fetchRating();
    }
  }, [dappId, isSupported, fetchRating]);

  useEffect(() => {
    if (dappId && isSupported && isConnected && address) {
      fetchUserVoteInfo();
    }
  }, [dappId, isSupported, isConnected, address, fetchUserVoteInfo]);

  const displayRating = rating?.average ?? 0;
  const starRating = Math.min(5, Math.max(0, displayRating));
  
  const hasPendingDecryption = (rating?.pendingDecryption ?? 0) > 0;

  return {
    
    rating,
    userVoteInfo,
    displayRating,
    starRating,
    hasPendingDecryption,
    
    loading,
    error,
    isSupported,
    
    refresh,
    fetchRating,
    fetchUserVoteInfo,
  };
}

export function calculateAverageRating(votes: number[]): number {
  if (votes.length === 0) return 0;
  const sum = votes.reduce((a, b) => a + b, 0);
  return sum / votes.length;
}

export function formatRating(rating: number): string {
  if (!rating || rating <= 0) return '0.0';
  return rating.toFixed(1);
}
