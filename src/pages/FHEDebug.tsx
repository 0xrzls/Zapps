
import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { 
  ArrowLeft, RefreshCw, Zap, Database, Lock, Unlock, 
  Play, Square, Wallet, Activity, AlertCircle, CheckCircle, 
  Clock, Trash2, Copy, ExternalLink, Star, RotateCw, Shield, Coins, Eye, EyeOff, Vote
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useFHERelayer } from '@/hooks/useFHERelayer';
import { useOnChainVoting } from '@/hooks/useOnChainVoting';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import { ZappsVoting, ZappsToken, TargetType } from '@/lib/contracts/zappsContracts';
import { backend } from '@/services';

const VOTING_CONTRACT = '0x753845153876736B50741EDFA584fF97fBECbd50';
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

const TEST_DAPPS = [
  { id: '394475a1-1fb5-4175-91f8-c5dfa9c3929c', name: 'Zama Protocol', category: 'FHE' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'UniSwap Clone', category: 'DeFi' },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'OpenSea Clone', category: 'NFT' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Axie Arena', category: 'Gaming' },
  { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', name: 'Lens Social', category: 'Social' },
  { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', name: 'Compound Finance', category: 'DeFi' },
  { id: 'f6a7b8c9-d0e1-2345-fabc-456789012345', name: 'Mirror Blog', category: 'Social' },
  { id: '17a8b9c0-e1f2-3456-abcd-567890123456', name: 'PancakeSwap', category: 'DeFi' },
  { id: '28b9c0d1-f2a3-4567-bcde-678901234567', name: 'The Sandbox', category: 'Gaming' },
  { id: '39c0d1e2-a3b4-5678-cdef-789012345678', name: 'Aave Protocol', category: 'DeFi' },
];

const VOTING_ABI = [
  'function getEncryptedData(bytes32 targetId) view returns (bytes32 encSum, bytes32 encCount)',
  'function getTargetData(bytes32 targetId) view returns (uint8 targetType, uint32 sum, uint32 count, uint256 average, uint256 totalVotes, uint256 uniqueVoters, uint256 lastUpdate)',
  'function targets(bytes32) view returns (uint8 targetType, bytes32 encSum, bytes32 encCount, uint32 decSum, uint32 decCount, uint256 lastDecryptTime, bool exists, uint256 createdAt, uint256 totalVotes, uint256 lastVoteTime)',
  'function requestDecryptionData(bytes32 targetId)',
  'function getAverageRating(bytes32 targetId) view returns (uint256)',
  'event DecryptionDataReady(bytes32 indexed targetId, bytes32 encSum, bytes32 encCount)',
];

function uuidToBytes32(uuid: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(uuid));
}

interface LogEntry {
  time: string;
  type: 'info' | 'error' | 'success' | 'warn';
  message: string;
}

type VoteStatus = 'idle' | 'encrypting' | 'signing' | 'confirming' | 'decrypting_avg' | 'success';

type DecryptStatus = 'idle' | 'waiting' | 'signing' | 'decrypting' | 'done';

export default function FHEDebug() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address, network } = useWallet();
  const [dappId, setDappId] = useState(id || '394475a1-1fb5-4175-91f8-c5dfa9c3929c');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetData, setTargetData] = useState<any>(null);
  const [encryptedHandles, setEncryptedHandles] = useState<{ encSum: string; encCount: string } | null>(null);
  const [decryptedResult, setDecryptedResult] = useState<any>(null);
  const [manualPrivateKey, setManualPrivateKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedScore, setSelectedScore] = useState<number>(5);
  const [userBalance, setUserBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerVote, setPricePerVote] = useState('10');
  const [userVoteCount, setUserVoteCount] = useState<number | null>(null);
  const [maxVotes, setMaxVotes] = useState(3);
  const [dappScores, setDappScores] = useState({ average: 0, count: 0, uniqueVoters: 0 });
  const [fhevmReady, setFhevmReady] = useState(false);
  const [fhevmError, setFhevmError] = useState<string | null>(null);
  
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [decryptedBalance, setDecryptedBalance] = useState<number | null>(null);
  const [decryptStatus, setDecryptStatus] = useState<DecryptStatus>('idle');
  
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [voteTxHash, setVoteTxHash] = useState<string | null>(null);
  const [decryptedAverage, setDecryptedAverage] = useState<number | null>(null);

  const {
    isAvailable,
    isRunning,
    relayerAddress,
    balance,
    state: relayerState,
    logs: relayerLogs,
    initialize,
    start,
    stop,
    checkTarget,
    checkAndDecrypt,
    refreshBalance,
    clearLogs: clearRelayerLogs,
  } = useFHERelayer();

  const { rating, refresh: refreshRating } = useOnChainVoting(dappId || undefined);

  useEffect(() => {
    if (id) setDappId(id);
  }, [id]);

  useEffect(() => {
    if (isAvailable && !isRunning && dappId) {
      console.log('[FHE-Debug] Auto-starting relayer for dappId:', dappId);
      start([dappId]);
    }
  }, [isAvailable, isRunning, dappId, start]);

  const log = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      time: new Date().toISOString().split('T')[1].split('.')[0],
      type,
      message,
    };
    setLogs(prev => [...prev, entry]);
    console.log(`[FHE-Debug] ${type.toUpperCase()}: ${message}`);
  }, []);

  const clearLogs = () => setLogs([]);

  const isFHEVoting = network === 'sepolia';
  
  useEffect(() => {
    const fetchVotingData = async () => {
      if (!address || !isFHEVoting) return;
      
      try {
        const adapter = (window as any).__walletAdapter;
        if (adapter instanceof EVMWalletAdapter) {
          
          const voting = new ZappsVoting(adapter);
          await voting.initialize();
          setFhevmReady(true);
          
          const price = await voting.getVotePrice();
          setPricePerVote((Number(price) / 1e18).toString());
          
          const voteInfo = await voting.getUserVoteInfo(dappId, address);
          console.log('[FHE-Debug] User vote info:', voteInfo);
          setUserVoteCount(Number(voteInfo.voteCount));
          
          const max = await voting.getMaxVotesPerTarget();
          setMaxVotes(max);
          
          const targetDataResult = await voting.getTargetData(dappId);
          console.log('[FHE-Debug] Target data:', targetDataResult);
          setDappScores({ 
            average: Number(targetDataResult.average) / 100,
            count: Number(targetDataResult.totalVotes),
            uniqueVoters: Number(targetDataResult.uniqueVoters)
          });
          
          const token = new ZappsToken(adapter);
          await token.initialize();
          
          const balanceHandle = await token.getConfidentialBalanceHandle(address);
          const hasBalance = balanceHandle !== ethers.ZeroHash;
          
          if (hasBalance) {
            setBalanceHidden(true);
            setUserBalance(0);
            
            const disclosed = await token.getDecryptedBalance(address);
            if (disclosed !== null) {
              const decimals = await token.getDecimals();
              const balance = Number(disclosed) / Math.pow(10, decimals);
              setDecryptedBalance(balance);
              setUserBalance(balance);
              setBalanceHidden(false);
            }
          } else {
            setUserBalance(0);
            setBalanceHidden(false);
          }
        }
      } catch (error) {
        console.error('[FHE-Debug] Failed to fetch voting data:', error);
        setFhevmError((error as Error).message || 'Failed to initialize FHEVM');
      }
    };

    if (address && isFHEVoting) {
      fetchVotingData();
    }
  }, [address, network, dappId, isFHEVoting]);

  const handleRevealBalance = async () => {
    if (!address || !isFHEVoting) return;
    
    if (decryptedBalance !== null) {
      setBalanceHidden(!balanceHidden);
      return;
    }

    setDecryptStatus('waiting');
    
    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Invalid wallet adapter');
      }

      toast.info('Please sign the message in your wallet...');
      setDecryptStatus('signing');

      const token = new ZappsToken(adapter);
      await token.initialize();

      setDecryptStatus('decrypting');
      toast.info('Decrypting balance...');

      const balance = await token.decryptBalance(address);
      const decimals = await token.getDecimals();
      const formattedBalance = Number(balance) / Math.pow(10, decimals);

      setDecryptedBalance(formattedBalance);
      setUserBalance(formattedBalance);
      setBalanceHidden(false);
      setDecryptStatus('done');

      toast.success(`Your ZVP balance: ${formattedBalance.toLocaleString()}`);
    } catch (error: any) {
      console.error('[FHE-Debug] Balance decryption failed:', error);
      toast.error(error.message || 'Failed to reveal balance');
      setDecryptStatus('idle');
    }
  };

  const getDecryptStatusText = () => {
    switch (decryptStatus) {
      case 'waiting': return 'Waiting...';
      case 'signing': return 'Sign message...';
      case 'decrypting': return 'Decrypting...';
      default: return null;
    }
  };

  const isDecrypting = decryptStatus !== 'idle' && decryptStatus !== 'done';

  const syncFHEScoresToDatabase = async (targetDappId: string, targetDataSync: {
    average: bigint;
    count: number;
    totalVotes: bigint;
    uniqueVoters: bigint;
  }) => {
    try {
      const voteScore = Number(targetDataSync.average) / 100;
      
      const { error } = await backend.scores.upsert({
        dapp_id: targetDappId,
        vote_score: voteScore,
      });

      if (error) {
        console.error('[FHE-Debug] Failed to sync scores:', error);
      } else {
        console.log('[FHE-Debug] Synced scores to database:', { targetDappId, voteScore });
      }
    } catch (err) {
      console.error('[FHE-Debug] Error syncing scores:', err);
    }
  };

  const handleVote = async () => {
    if (!address) {
      toast.error('Please connect your wallet to vote');
      return;
    }

    if (!isFHEVoting) {
      toast.error('Switch to Sepolia network to use FHE voting');
      return;
    }

    if ((userVoteCount ?? 0) >= maxVotes) {
      toast.error(`Maximum ${maxVotes} votes per dApp`);
      return;
    }

    setIsSubmitting(true);
    setVoteStatus('encrypting');
    console.log('[FHE-Debug] Starting vote:', { dappId, score: selectedScore });

    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Invalid wallet adapter');
      }

      const voting = new ZappsVoting(adapter);
      await voting.initialize();

      toast.info('Encrypting vote...');
      setVoteStatus('signing');
      toast.info('Please confirm in your wallet...');

      const tx = await voting.vote(dappId, selectedScore, TargetType.DApp);
      
      setVoteStatus('confirming');
      toast.info('Waiting for blockchain confirmation...');
      
      await tx.wait();
      
      const txHash = tx.hash;
      setVoteTxHash(txHash);

      console.log('[FHE-Debug] Vote tx hash:', txHash);
      
      const voteInfo = await voting.getUserVoteInfo(dappId, address!);
      setUserVoteCount(voteInfo.voteCount);

      setVoteStatus('decrypting_avg');
      toast.info(isAvailable ? 'Auto-decrypting via relayer...' : 'Requesting FHE decryption...');

      let averageRating = 0;
      let totalVotes = 0;
      let uniqueVoters = 0;
      
      const targetDataResult = await voting.getTargetData(dappId);
      totalVotes = Number(targetDataResult.totalVotes);
      uniqueVoters = Number(targetDataResult.uniqueVoters);
      
      let onChainAverage = Number(targetDataResult.average) / 100;
      
      if (onChainAverage > 0) {
        averageRating = onChainAverage;
        console.log('[FHE-Debug] Got decrypted average from on-chain:', averageRating);
      } else if (isAvailable) {
        console.log('[FHE-Debug] Using frontend relayer for decryption...');
        try {
          toast.info('Frontend relayer is processing...');
          
          const result = await checkAndDecrypt(dappId);
          
          if (result?.txHash) {
            console.log('[FHE-Debug] Relayer decryption requested:', result.txHash);
            toast.info('Waiting for Zama Gateway callback (~30-60s)...');
            
            const pollForRelayerResult = async (retries = 8, delay = 8000) => {
              for (let i = 0; i < retries; i++) {
                await new Promise(r => setTimeout(r, delay));
                console.log(`[FHE-Debug] Relayer poll attempt ${i + 1}/${retries}...`);
                
                try {
                  const adapterRefresh = (window as any).__walletAdapter;
                  if (adapterRefresh instanceof EVMWalletAdapter) {
                    const votingRefresh = new ZappsVoting(adapterRefresh);
                    await votingRefresh.initialize();
                    const refreshedData = await votingRefresh.getTargetData(dappId);
                    const newAvg = Number(refreshedData.average) / 100;
                    
                    if (newAvg > 0) {
                      console.log('[FHE-Debug] Relayer poll success! Average:', newAvg);
                      setDappScores(prev => ({ ...prev, average: newAvg }));
                      setDecryptedAverage(newAvg);
                      
                      await syncFHEScoresToDatabase(dappId, {
                        average: BigInt(Math.round(newAvg * 100)),
                        count: Number(refreshedData.totalVotes),
                        totalVotes: refreshedData.totalVotes,
                        uniqueVoters: refreshedData.uniqueVoters,
                      });
                      
                      toast.success(`Rating Updated! New average: ${newAvg.toFixed(1)}/5`);
                      refreshRating();
                      return;
                    }
                  }
                } catch (e) {
                  console.warn('[FHE-Debug] Relayer poll error:', e);
                }
              }
              console.log('[FHE-Debug] Relayer polling timeout');
            };
            
            pollForRelayerResult();
          }
        } catch (relayerError) {
          console.warn('[FHE-Debug] Frontend relayer failed:', relayerError);
        }
      }
      
      if (averageRating === 0 && isAvailable) {
        console.log('[FHE-Debug] Relayer will handle decryption automatically...');
        toast.info('Relayer is processing decryption in background...');
        
        try {
          const relayerResult = await checkAndDecrypt(dappId);
          if (relayerResult?.txHash) {
            console.log('[FHE-Debug] Relayer triggered decryption TX:', relayerResult.txHash);
          }
        } catch (e) {
          console.warn('[FHE-Debug] Relayer trigger failed, will poll for result:', e);
        }
        
        console.log('[FHE-Debug] Polling for decrypted average (read-only)...');
        for (let i = 0; i < 8; i++) {
          await new Promise(r => setTimeout(r, 8000));
          console.log(`[FHE-Debug] Read poll attempt ${i + 1}/8...`);
          
          const refreshedData = await voting.getTargetData(dappId);
          const newAvg = Number(refreshedData.average) / 100;
          
          if (newAvg > 0) {
            averageRating = newAvg;
            totalVotes = Number(refreshedData.totalVotes);
            console.log('[FHE-Debug] Decryption complete! Average:', newAvg);
            toast.success(`Decrypted! Average: ${newAvg.toFixed(1)}/5`);
            break;
          }
        }
        
        if (averageRating === 0) {
          toast.info('Decryption in progress... Rating will update shortly.');
        }
      } else if (averageRating === 0 && !isAvailable) {
        
        console.log('[FHE-Debug] No relayer available - cannot auto-decrypt');
        toast.info('Rating will be decrypted by the relayer. Check back later.');
      }
      
      setDappScores({ 
        average: averageRating,
        count: totalVotes, 
        uniqueVoters: uniqueVoters
      });
      setDecryptedAverage(averageRating);
      
      if (averageRating > 0) {
        await syncFHEScoresToDatabase(dappId, {
          average: BigInt(Math.round(averageRating * 100)),
          count: totalVotes,
          totalVotes: BigInt(totalVotes),
          uniqueVoters: BigInt(uniqueVoters),
        });
      }

      setVoteStatus('success');
      toast.success(`Vote submitted! Score: ${selectedScore}★`);
      refreshRating();

    } catch (error: any) {
      console.error('[FHE-Debug] Vote failed:', error);
      toast.error(error.message || 'Failed to cast encrypted vote');
      setVoteStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getTargetData = async () => {
    log('info', `Fetching target data for: ${dappId}`);
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const contract = new ethers.Contract(VOTING_CONTRACT, VOTING_ABI, provider);
      const targetId = uuidToBytes32(dappId);
      
      log('info', `Target ID (bytes32): ${targetId}`);
      
      const rawData = await contract.targets(targetId);
      log('info', `Raw targets data received`);
      
      const data = {
        exists: rawData.exists,
        targetType: Number(rawData.targetType),
        encSum: rawData.encSum,
        encCount: rawData.encCount,
        decSum: Number(rawData.decSum),
        decCount: Number(rawData.decCount),
        lastDecryptTime: Number(rawData.lastDecryptTime),
        totalVotes: Number(rawData.totalVotes),
        createdAt: Number(rawData.createdAt),
        lastVoteTime: Number(rawData.lastVoteTime),
      };
      
      setTargetData(data);
      
      log(data.exists ? 'success' : 'warn', `Target exists: ${data.exists}`);
      log('info', `Total votes: ${data.totalVotes}`);
      log('info', `Decrypted sum: ${data.decSum}, count: ${data.decCount}`);
      log('info', `Encrypted sum handle: ${data.encSum}`);
      log('info', `Encrypted count handle: ${data.encCount}`);
      
      const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (data.encSum === zeroHash || data.encCount === zeroHash) {
        log('warn', 'Encrypted handles are zero - no encrypted data to decrypt');
      } else {
        log('success', 'Non-zero encrypted handles found!');
      }
      
      return data;
    } catch (error: any) {
      log('error', `Failed to get target data: ${error.message}`);
      throw error;
    }
  };

  const getEncryptedData = async () => {
    log('info', 'Calling getEncryptedData function...');
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const contract = new ethers.Contract(VOTING_CONTRACT, VOTING_ABI, provider);
      const targetId = uuidToBytes32(dappId);
      
      const result = await contract.getEncryptedData(targetId);
      const handles = {
        encSum: result[0],
        encCount: result[1],
      };
      
      setEncryptedHandles(handles);
      log('success', `getEncryptedData returned handles`);
      log('info', `encSum: ${handles.encSum}`);
      log('info', `encCount: ${handles.encCount}`);
      
      return handles;
    } catch (error: any) {
      const reason = error?.reason || error?.message || String(error);
      if (reason.includes('TargetNotExists')) {
        log('warn', 'Target does not exist yet');
      } else {
        log('error', `getEncryptedData failed: ${reason}`);
      }
      throw error;
    }
  };

  const testPublicDecryptWithHandles = async (handles: { encSum: string; encCount: string }) => {
    const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (handles.encSum === zeroHash || handles.encCount === zeroHash) {
      log('error', 'Cannot decrypt zero handles');
      return;
    }
    
    log('info', 'Initializing Relayer SDK for publicDecrypt...');
    
    try {
      const sdk = (window as any).relayerSDK;
      if (!sdk) {
        log('error', 'Relayer SDK not loaded! Waiting 2s and retrying...');
        await new Promise(r => setTimeout(r, 2000));
        const sdk2 = (window as any).relayerSDK;
        if (!sdk2) {
          log('error', 'Relayer SDK still not loaded after wait');
          return;
        }
      }
      
      const finalSdk = (window as any).relayerSDK;
      log('info', 'SDK found, initializing...');
      await finalSdk.initSDK();
      log('success', 'SDK initialized');
      
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        log('error', 'No ethereum provider');
        return;
      }
      
      log('info', 'Creating FHEVM instance...');
      const config = { ...finalSdk.SepoliaConfig, network: ethereum };
      const instance = await finalSdk.createInstance(config);
      log('success', 'FHEVM instance created');
      log('info', `Instance methods: ${Object.keys(instance).filter(k => typeof instance[k] === 'function').join(', ')}`);
      
      if (typeof instance.publicDecrypt !== 'function') {
        log('error', 'publicDecrypt method not found on instance!');
        return;
      }
      
      log('info', 'Calling publicDecrypt with handles...');
      log('info', `Handle 1 (encSum): ${handles.encSum}`);
      log('info', `Handle 2 (encCount): ${handles.encCount}`);
      
      const startTime = Date.now();
      const result = await instance.publicDecrypt([handles.encSum, handles.encCount]);
      const elapsed = Date.now() - startTime;
      
      log('success', `publicDecrypt completed in ${elapsed}ms`);
      log('info', `Result: ${JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v)}`);
      
      setDecryptedResult(result);
      
      if (result?.clearValues) {
        const sum = result.clearValues[handles.encSum];
        const count = result.clearValues[handles.encCount];
        log('success', `Decrypted sum: ${sum}, count: ${count}`);
        
        if (Number(count) > 0) {
          const average = Number(sum) / Number(count);
          log('success', `Average rating: ${average.toFixed(2)}`);
        }
      } else {
        log('warn', 'No clearValues in result - check result structure');
        log('info', `Result keys: ${Object.keys(result || {}).join(', ')}`);
      }
      
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      log('error', `publicDecrypt failed: ${errorMsg}`);
      
      if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('429')) {
        log('warn', 'Rate limit detected! Zama Gateway is rate-limited on testnet.');
      }
      
      console.error('[FHE-Debug] Full error:', error);
    }
  };

  const runAllSteps = async () => {
    setLoading(true);
    clearLogs();
    setTargetData(null);
    setEncryptedHandles(null);
    setDecryptedResult(null);
    
    try {
      log('info', '=== Step 1: Get Target Data ===');
      await getTargetData();
      
      log('info', '=== Step 2: Get Encrypted Handles ===');
      const handles = await getEncryptedData();
      
      if (!handles) {
        log('error', 'No handles returned from step 2');
        return;
      }
      
      log('info', '=== Step 3: Public Decrypt (Frontend SDK) ===');
      log('warn', 'NOTE: This may fail if requestDecryptionData() was not called first!');
      await testPublicDecryptWithHandles(handles);
      
      log('success', '=== All steps completed ===');
      toast.success('Debug completed - check logs');
    } catch (error: any) {
      log('error', `Debug flow interrupted: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const runStandaloneDecrypt = async () => {
    if (!dappId) {
      toast.error('Select a dApp first');
      return;
    }
    
    if (!isAvailable) {
      toast.error('Relayer not available - check VITE_RELAYER_PRIVATE_KEY');
      return;
    }
    
    setLoading(true);
    clearLogs();
    
    try {
      log('info', '=== AUTO-DECRYPTION (Relayer Mode - No User TX) ===');
      log('info', `dApp ID: ${dappId}`);
      log('info', `Relayer address: ${relayerAddress}`);
      
      const targetId = uuidToBytes32(dappId);
      log('info', `Target ID: ${targetId}`);
      
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const contract = new ethers.Contract(VOTING_CONTRACT, VOTING_ABI, provider);
      
      const rawData = await contract.targets(targetId);
      const currentData = {
        exists: rawData.exists,
        totalVotes: Number(rawData.totalVotes),
        decSum: Number(rawData.decSum),
        decCount: Number(rawData.decCount),
        encSum: rawData.encSum,
        encCount: rawData.encCount,
      };
      
      log('info', `Current state: totalVotes=${currentData.totalVotes}, decSum=${currentData.decSum}, decCount=${currentData.decCount}`);
      
      if (!currentData.exists) {
        log('error', 'Target does not exist');
        toast.error('No votes on this dApp yet');
        return;
      }
      
      const pendingCount = currentData.totalVotes - currentData.decCount;
      log('info', `Pending decryption: ${pendingCount} votes`);
      
      if (pendingCount === 0) {
        const average = currentData.decCount > 0 ? currentData.decSum / currentData.decCount : 0;
        log('success', `Already fully decrypted! Average: ${average.toFixed(2)}`);
        setDecryptedResult({
          sum: currentData.decSum,
          count: currentData.decCount,
          average,
          status: 'already_decrypted'
        });
        toast.success(`Average: ${average.toFixed(1)}/5`);
        return;
      }
      
      log('info', '=== Step 2: Relayer calling requestDecryptionData() ===');
      log('info', 'Using relayer private key - NO USER SIGNATURE REQUIRED');
      toast.info('Relayer is requesting decryption...');
      
      try {
        const result = await checkAndDecrypt(dappId);
        
        if (result?.txHash) {
          log('success', `Relayer TX submitted: ${result.txHash}`);
          log('info', 'Zama Gateway will process and call verifyAndStoreDecryption automatically');
        } else if (result?.status.pendingDecryption === 0) {
          log('info', 'Already fully decrypted');
        } else {
          log('info', 'Decryption request sent, waiting for Gateway...');
        }
        
        log('info', '=== Step 3: Polling for Gateway callback (~30-60s) ===');
        toast.info('Waiting for Zama Gateway callback...');
        
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 6000));
          log('info', `Poll attempt ${i + 1}/10...`);
          
          const avgRating = await contract.getAverageRating(targetId);
          const average = Number(avgRating) / 100;
          
          log('info', `getAverageRating() returned: ${average.toFixed(2)}`);
          
          const refreshedData = await contract.targets(targetId);
          const newDecSum = Number(refreshedData.decSum);
          const newDecCount = Number(refreshedData.decCount);
          
          log('info', `Raw data: decSum=${newDecSum}, decCount=${newDecCount}`);
          
          if (newDecCount > currentData.decCount || average > 0) {
            log('success', `Decryption complete! Average dApp Rating: ${average.toFixed(2)}/5`);
            
            setDecryptedResult({
              sum: newDecSum,
              count: newDecCount,
              average,
              status: 'decrypted'
            });
            
            setDappScores({ average, count: newDecCount, uniqueVoters: 0 });
            toast.success(`dApp Average Rating: ${average.toFixed(1)}/5`);
            refreshRating();
            return;
          }
        }
        
        log('warn', 'Polling timeout - Gateway may still be processing');
        toast.info('Gateway still processing - check again later');
        
      } catch (relayerError: any) {
        log('error', `Relayer failed: ${relayerError?.message || relayerError}`);
        toast.error('Relayer decryption failed');
      }
      
    } catch (error: any) {
      log('error', `Standalone decrypt failed: ${error?.message || error}`);
      toast.error('Failed to decrypt');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = () => {
    if (manualPrivateKey) {
      initialize({ privateKey: manualPrivateKey });
      toast.success('Relayer initialized with custom key');
    } else {
      initialize();
      if (isAvailable) {
        toast.success('Relayer initialized from .env');
      } else {
        toast.error('No VITE_RELAYER_PRIVATE_KEY in .env');
      }
    }
  };

  const handleCheckTarget = async () => {
    if (!dappId) {
      toast.error('Enter a dApp ID first');
      return;
    }
    
    setIsProcessing(true);
    try {
      const status = await checkTarget(dappId);
      if (status) {
        toast.success(`Target checked: ${status.pendingDecryption} pending`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!dappId) {
      toast.error('Enter a dApp ID first');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await checkAndDecrypt(dappId);
      if (result?.txHash) {
        toast.success(`Decryption requested: ${result.txHash.slice(0, 10)}...`);
      } else if (result?.status.pendingDecryption === 0) {
        toast.info('No pending decryptions');
      } else {
        toast.info('Decryption already in progress');
      }
      
      setTimeout(() => refreshRating(), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyAddress = () => {
    if (relayerAddress) {
      navigator.clipboard.writeText(relayerAddress);
      toast.success('Address copied');
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-3 w-3" />;
      case 'warn': return <Clock className="h-3 w-3" />;
      case 'success': return <CheckCircle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const isSupported = network === 'sepolia';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">FHE Debug Console</h1>
              <p className="text-muted-foreground text-sm">
                Test FHE operations & run frontend relayer
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={isSupported ? 'default' : 'secondary'}>
              {network || 'Not Connected'}
            </Badge>
            <Badge variant={isAvailable ? 'default' : 'outline'}>
              {isAvailable ? 'Relayer Ready' : 'No Relayer Key'}
            </Badge>
          </div>
        </div>

        {}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <select
                value={dappId}
                onChange={(e) => setDappId(e.target.value)}
                className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TEST_DAPPS.map((dapp) => (
                  <option key={dapp.id} value={dapp.id}>
                    {dapp.name} ({dapp.category})
                  </option>
                ))}
              </select>
              <Input
                value={dappId}
                onChange={(e) => setDappId(e.target.value)}
                placeholder="Or enter custom UUID"
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={() => refreshRating()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            {rating && (
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span>Votes: <strong className="text-foreground">{rating.totalVotes}</strong></span>
                <span>Decrypted: <strong className="text-foreground">{rating.decryptedCount}</strong></span>
                <span>Pending: <strong className={rating.pendingDecryption > 0 ? 'text-orange-500' : 'text-foreground'}>{rating.pendingDecryption}</strong></span>
                <span>Avg: <strong className="text-foreground">{rating.average.toFixed(2)}</strong></span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="vote" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vote">⭐ Vote Test</TabsTrigger>
            <TabsTrigger value="relayer">🔥 Frontend Relayer</TabsTrigger>
            <TabsTrigger value="debug">🔬 Debug Tools</TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="vote" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  FHE Voting Test
                </CardTitle>
                <CardDescription>
                  Cast encrypted votes just like the main app - test the full flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isConnected ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Connect your wallet to vote
                    </p>
                  </div>
                ) : !isFHEVoting ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Switch to Sepolia network for FHE voting
                    </p>
                  </div>
                ) : (
                  <>
                    {}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-background to-accent/10 p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Coins className="w-3 h-3" />
                            <p className="text-xs">Your ZVP</p>
                            <button 
                              onClick={handleRevealBalance}
                              disabled={isDecrypting}
                              className="ml-auto p-1 hover:bg-muted/50 rounded transition-colors"
                            >
                              {isDecrypting ? (
                                <RotateCw className="w-3 h-3 animate-spin" />
                              ) : balanceHidden ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-primary" />
                              )}
                            </button>
                          </div>
                          {balanceHidden ? (
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-bold text-muted-foreground">••••••</p>
                              {getDecryptStatusText() && (
                                <span className="text-[10px] text-primary animate-pulse">{getDecryptStatusText()}</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xl font-bold">{userBalance.toLocaleString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-background to-primary/5 p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Vote className="w-3 h-3" />
                            <p className="text-xs">Total Votes</p>
                          </div>
                          <p className="text-xl font-bold">{dappScores.count.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-green-500/20 bg-gradient-to-br from-background to-green-500/5 p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Star className="w-3 h-3" />
                            <p className="text-xs">Average</p>
                          </div>
                          <p className="text-xl font-bold">{dappScores.average.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-gradient-to-br from-background to-yellow-500/5 p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Activity className="w-3 h-3" />
                            <p className="text-xs">Your Votes</p>
                          </div>
                          <p className="text-xl font-bold">{userVoteCount ?? 0}/{maxVotes}</p>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Rate this dApp</label>
                        <span className="text-xs text-muted-foreground">
                          Cost: {pricePerVote} ZVP per vote
                        </span>
                      </div>
                      <div className="flex gap-2 justify-center p-4 bg-muted/30 rounded-xl">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => setSelectedScore(score)}
                            disabled={(userVoteCount ?? 0) >= maxVotes}
                            className={`p-3 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                              selectedScore >= score
                                ? 'text-yellow-500 scale-110'
                                : 'text-muted-foreground hover:text-yellow-500/50'
                            }`}
                          >
                            <Star className="w-8 h-8" fill={selectedScore >= score ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">Encrypted Rating</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-2xl font-bold">{selectedScore}</p>
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">End-to-end encrypted on-chain</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>

                    {}
                    {(userVoteCount ?? 0) >= maxVotes && (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-destructive">Vote Limit Reached</p>
                            <p className="text-xs text-muted-foreground">
                              Maximum {maxVotes} encrypted votes per user per dApp.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {}
                    {(userVoteCount ?? 0) >= maxVotes ? (
                      <Button 
                        className="w-full h-12"
                        disabled={true}
                        variant="outline"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Vote Limit Reached ({userVoteCount}/{maxVotes})
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleVote}
                        className="w-full h-12 gradient-primary glow-effect"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>
                              {voteStatus === 'encrypting' && 'Encrypting...'}
                              {voteStatus === 'signing' && 'Sign in wallet...'}
                              {voteStatus === 'confirming' && 'Confirming...'}
                              {voteStatus === 'decrypting_avg' && 'Decrypting average...'}
                              {voteStatus === 'success' && 'Success!'}
                            </span>
                          </div>
                        ) : (
                          <>
                            <Star className="w-4 h-4" />
                            Cast Encrypted Vote ({pricePerVote} ZVP)
                          </>
                        )}
                      </Button>
                    )}

                    {}
                    {voteStatus === 'success' && voteTxHash && (
                      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Vote Successful!</span>
                        </div>
                        
                        {decryptedAverage !== null && decryptedAverage > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">New Average Rating</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-2xl font-bold">{decryptedAverage.toFixed(1)}</span>
                              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                            </div>
                          </div>
                        )}
                        
                        <a
                          href={`https://sepolia.etherscan.io/tx/${voteTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                        >
                          <span>View Transaction</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {}
          <TabsContent value="relayer" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Relayer Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure wallet for signing transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Private Key</label>
                    <Input
                      type="password"
                      placeholder="0x... (or use VITE_RELAYER_PRIVATE_KEY in .env)"
                      value={manualPrivateKey}
                      onChange={(e) => setManualPrivateKey(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={handleInitialize} className="w-full">
                    Initialize Relayer
                  </Button>

                  {isAvailable && (
                    <>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Address:</span>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {relayerAddress?.slice(0, 8)}...{relayerAddress?.slice(-6)}
                            </code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <a href={`https://sepolia.etherscan.io/address/${relayerAddress}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Balance:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : '...'}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshBalance}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Operations
                  </CardTitle>
                  <CardDescription>
                    Trigger decryption manually or auto-watch
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCheckTarget}
                      disabled={!isAvailable || isProcessing}
                      className="flex-1"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Check Status
                    </Button>
                    <Button 
                      onClick={handleDecrypt}
                      disabled={!isAvailable || isProcessing}
                      className="flex-1"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Request Decrypt
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Relayer</p>
                      <p className="text-xs text-muted-foreground">Watch for new votes</p>
                    </div>
                    <Badge variant={isRunning ? 'default' : 'secondary'}>
                      {isRunning ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>

                  <Button
                    variant={isRunning ? 'destructive' : 'default'}
                    onClick={() => isRunning ? stop() : start(dappId ? [dappId] : undefined)}
                    disabled={!isAvailable}
                    className="w-full"
                  >
                    {isRunning ? (
                      <><Square className="h-4 w-4 mr-2" />Stop Relayer</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" />Start Relayer</>
                    )}
                  </Button>

                  {relayerState && (
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 bg-muted rounded">
                        <div className="text-lg font-bold">{relayerState.processedCount}</div>
                        <div className="text-muted-foreground">Processed</div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-lg font-bold text-red-500">{relayerState.errorCount}</div>
                        <div className="text-muted-foreground">Errors</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Relayer Logs</span>
                  <Button variant="ghost" size="sm" onClick={clearRelayerLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] rounded-md border p-4">
                  {relayerLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No logs yet. Initialize the relayer to get started.
                    </p>
                  ) : (
                    <div className="space-y-2 font-mono text-xs">
                      {relayerLogs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-2 ${getLogColor(log.level)}`}>
                          {getLogIcon(log.level)}
                          <span className="text-muted-foreground shrink-0">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className="break-all">
                            {log.message}
                            {log.data && (
                              <span className="text-muted-foreground ml-2">
                                {typeof log.data === 'object' ? JSON.stringify(log.data) : String(log.data)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">1. Add to .env:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# Relayer private key (sepolia testnet)
VITE_RELAYER_PRIVATE_KEY="0x..."

# Optional: Alchemy API for better RPC
VITE_ALCHEMY_API_KEY="..."`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">2. Fund the relayer:</h4>
                  <p className="text-muted-foreground">
                    Send Sepolia ETH to the relayer address for gas. Get testnet ETH from{' '}
                    <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      sepoliafaucet.com
                    </a>
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Use in code:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import { useFHERelayer } from '@/hooks/useFHERelayer';

function MyComponent() {
  const { checkAndDecrypt, start, stop } = useFHERelayer();
  
  // Manual
  await checkAndDecrypt('dapp-uuid');
  
  // Auto-watch
  start(['dapp-uuid']);
  return () => stop();
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {}
          <TabsContent value="debug" className="space-y-4">
            {}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-4 text-sm">
                  <span>Network: <strong className={isSupported ? 'text-green-500' : 'text-red-500'}>{network || 'not connected'}</strong></span>
                  <span>Wallet: <strong>{isConnected ? address?.slice(0, 10) + '...' : 'not connected'}</strong></span>
                </div>
                {!isSupported && (
                  <p className="text-yellow-500 text-sm">Switch to Sepolia network to test FHE</p>
                )}
              </CardContent>
            </Card>

            {}
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <Shield className="w-5 h-5" />
                  Relayer Auto-Decrypt (No User TX!)
                </CardTitle>
                <CardDescription>
                  Uses RELAYER private key to call requestDecryptionData() - NO USER SIGNATURE NEEDED
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={runStandaloneDecrypt} disabled={loading || !isAvailable} className="bg-green-600 hover:bg-green-700">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Auto-Decrypt (Relayer)
                  </Button>
                  <Button variant="outline" onClick={getTargetData} disabled={loading}>
                    <Database className="w-4 h-4 mr-2" />
                    Check State
                  </Button>
                </div>
                <p className="text-xs text-green-600">
                  ✅ Relayer mode: Uses VITE_RELAYER_PRIVATE_KEY - user only sees read results, NO TX signing!
                </p>
                {!isAvailable && (
                  <p className="text-xs text-destructive">⚠️ Relayer not available - set VITE_RELAYER_PRIVATE_KEY in .env</p>
                )}
                {isAvailable && relayerAddress && (
                  <p className="text-xs text-muted-foreground">Relayer: {relayerAddress.slice(0, 10)}...</p>
                )}
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Frontend SDK Test (Debug Only)
                </CardTitle>
                <CardDescription>
                  Direct SDK call - may fail with "Handle not allowed for public decryption" if ACL not set
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={runAllSteps} disabled={loading || !isSupported}>
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Run All Steps (SDK)
                  </Button>
                  <Button variant="outline" onClick={() => getTargetData()} disabled={loading}>
                    <Database className="w-4 h-4 mr-2" />
                    Step 1: Get Target
                  </Button>
                  <Button variant="outline" onClick={() => getEncryptedData()} disabled={loading}>
                    <Lock className="w-4 h-4 mr-2" />
                    Step 2: Get Handles
                  </Button>
                  <Button variant="outline" onClick={() => encryptedHandles && testPublicDecryptWithHandles(encryptedHandles)} disabled={loading || !encryptedHandles}>
                    <Unlock className="w-4 h-4 mr-2" />
                    Step 3: Decrypt (SDK)
                  </Button>
                  <Button variant="ghost" onClick={clearLogs}>
                    Clear Logs
                  </Button>
                </div>
                <p className="text-xs text-yellow-500">
                  ⚠️ Frontend SDK cannot call requestDecryptionData() - that requires a wallet with gas.
                </p>
              </CardContent>
            </Card>

            {}
            {(targetData || decryptedResult) && (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {targetData && (
                    <div>
                      <h3 className="font-semibold mb-2">Target Data:</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(targetData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {decryptedResult && (
                    <div>
                      <h3 className="font-semibold mb-2">Decrypted Result:</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(decryptedResult, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {}
            <Card>
              <CardHeader>
                <CardTitle>Debug Logs ({logs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/90 text-green-400 p-4 rounded font-mono text-xs h-80 overflow-auto">
                  {logs.length === 0 ? (
                    <span className="text-gray-500">Run a test to see logs...</span>
                  ) : (
                    logs.map((entry, i) => (
                      <div key={i} className={`mb-1 ${
                        entry.type === 'error' ? 'text-red-400' :
                        entry.type === 'success' ? 'text-green-400' :
                        entry.type === 'warn' ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}>
                        <span className="text-gray-500">[{entry.time}]</span> {entry.message}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
