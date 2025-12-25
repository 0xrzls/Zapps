
import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useFHERelayer } from './useFHERelayer';

const VOTING_CONTRACT = '0x753845153876736B50741EDFA584fF97fBECbd50';
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

const VOTING_ABI = [
  'function getTargetData(bytes32 targetId) view returns (uint8 targetType, uint32 sum, uint32 count, uint256 average, uint256 totalVotes, uint256 uniqueVoters, uint256 lastUpdate)',
  'function getAverageRating(bytes32 targetId) view returns (uint256)',
  'function targets(bytes32) view returns (uint8 targetType, bytes32 encSum, bytes32 encCount, uint32 decSum, uint32 decCount, uint256 lastDecryptTime, bool exists, uint256 createdAt, uint256 totalVotes, uint256 lastVoteTime)',
];

const STORAGE_KEY = 'fhe_ratings_cache';

function uuidToBytes32(uuid: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(uuid));
}

export interface FHERating {
  dappId: string;
  dappName: string;
  average: number;
  count: number;
  totalVotes: number;
  uniqueVoters: number;
  lastUpdate: number;
  pendingDecryption: number;
  needsDecryption: boolean;
}

export interface UseFHEAutoSyncReturn {
  
  isLoading: boolean;
  isSyncing: boolean;
  ratings: FHERating[];
  lastSync: Date | null;
  error: string | null;
  
  fetchRating: (dappId: string, dappName?: string) => Promise<FHERating | null>;
  decryptAndFetch: (dappId: string, dappName?: string) => Promise<FHERating | null>;
  clearCache: () => void;
}

function loadCachedRatings(): { ratings: FHERating[]; lastSync: Date | null } {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      return {
        ratings: data.ratings || [],
        lastSync: data.lastSync ? new Date(data.lastSync) : null,
      };
    }
  } catch (err) {
    console.error('[FHEAutoSync] Failed to load cache:', err);
  }
  return { ratings: [], lastSync: null };
}

function saveCachedRatings(ratings: FHERating[], lastSync: Date) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ratings, lastSync: lastSync.toISOString() }));
  } catch (err) {
    console.error('[FHEAutoSync] Failed to save cache:', err);
  }
}

export function useFHEAutoSync(): UseFHEAutoSyncReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ratings, setRatings] = useState<FHERating[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);
  
  const {
    isAvailable: relayerAvailable,
    checkTarget,
    checkAndDecrypt,
  } = useFHERelayer();

  useEffect(() => {
    providerRef.current = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    contractRef.current = new ethers.Contract(
      VOTING_CONTRACT,
      VOTING_ABI,
      providerRef.current
    );
    
    const cached = loadCachedRatings();
    setRatings(cached.ratings);
    setLastSync(cached.lastSync);
  }, []);

  const fetchRating = useCallback(async (dappId: string, dappName: string = 'Unknown'): Promise<FHERating | null> => {
    if (!contractRef.current) return null;
    
    setIsLoading(true);
    setError(null);

    const targetId = uuidToBytes32(dappId);
    
    try {
      
      const targetData = await contractRef.current.getTargetData(targetId);
      const targetRaw = await contractRef.current.targets(targetId);
      
      const totalVotes = Number(targetData.totalVotes);
      const decCount = Number(targetRaw.decCount);
      const pendingDecryption = totalVotes - decCount;
      
      const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const hasEncryptedData = targetRaw.encSum !== zeroHash && targetRaw.encCount !== zeroHash;
      
      const rating: FHERating = {
        dappId,
        dappName,
        average: Number(targetData.average) / 100, 
        count: Number(targetData.count),
        totalVotes,
        uniqueVoters: Number(targetData.uniqueVoters),
        lastUpdate: Number(targetData.lastUpdate),
        pendingDecryption,
        needsDecryption: pendingDecryption > 0 && hasEncryptedData,
      };
      
      setRatings(prev => {
        const idx = prev.findIndex(r => r.dappId === dappId);
        const updated = idx >= 0 
          ? [...prev.slice(0, idx), rating, ...prev.slice(idx + 1)]
          : [...prev, rating];
        
        const now = new Date();
        setLastSync(now);
        saveCachedRatings(updated, now);
        
        return updated;
      });
      
      console.log(`[FHEAutoSync] Fetched ${dappName}: avg=${rating.average}, votes=${rating.totalVotes}, pending=${rating.pendingDecryption}`);
      return rating;
    } catch (err: any) {
      
      if (err.message?.includes('TargetNotExists') || err.reason?.includes('TargetNotExists')) {
        const emptyRating: FHERating = {
          dappId,
          dappName,
          average: 0,
          count: 0,
          totalVotes: 0,
          uniqueVoters: 0,
          lastUpdate: 0,
          pendingDecryption: 0,
          needsDecryption: false,
        };
        return emptyRating;
      }
      
      setError(err.message);
      console.error(`[FHEAutoSync] Error fetching rating for ${dappId}:`, err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const decryptAndFetch = useCallback(async (dappId: string, dappName: string = 'Unknown'): Promise<FHERating | null> => {
    if (!relayerAvailable) {
      console.error('[FHEAutoSync] Relayer not available');
      setError('Relayer not available');
      return null;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      
      const status = await checkTarget(dappId);
      
      if (!status || status.pendingDecryption === 0) {
        console.log(`[FHEAutoSync] No pending decryption for ${dappId}`);
        
        return await fetchRating(dappId, dappName);
      }
      
      console.log(`[FHEAutoSync] Requesting decryption for ${dappId}...`);
      const result = await checkAndDecrypt(dappId);
      
      if (result?.txHash) {
        console.log(`[FHEAutoSync] Decryption TX: ${result.txHash}`);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      return await fetchRating(dappId, dappName);
    } catch (err: any) {
      setError(err.message);
      console.error(`[FHEAutoSync] Decrypt error for ${dappId}:`, err);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [relayerAvailable, checkTarget, checkAndDecrypt, fetchRating]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRatings([]);
    setLastSync(null);
    console.log('[FHEAutoSync] Cache cleared');
  }, []);

  return {
    isLoading,
    isSyncing,
    ratings,
    lastSync,
    error,
    fetchRating,
    decryptAndFetch,
    clearCache,
  };
}
