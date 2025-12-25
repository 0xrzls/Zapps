import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Vote, Coins, TrendingUp, AlertCircle, Star, Lock, ChevronDown, CheckCircle, RotateCw, Clock, Shield, Eye, EyeOff, ExternalLink, Zap } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { backend } from '@/services';
import { EVMWalletAdapter } from '@/lib/wallet/adapters/EVMWalletAdapter';
import { ZappsVoting, ZappsToken, TargetType } from '@/lib/contracts/zappsContracts';
import { isEVMNetwork } from '@/lib/wallet/config';
import { useFHERelayer } from '@/hooks/useFHERelayer';

const logVoteEvent = (event: string, data: Record<string, any>) => {
  console.log(`[Vote] ${event}:`, data);
};

const logFHEVoteEvent = (event: string, data: Record<string, any>) => {
  console.log(`[FHE-Vote] ${event}:`, data);
};

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  dappName: string;
  dappId: string;
  currentVotes: number;
  onVote: (amount: number, fheData?: { average: number; count: number; uniqueVoters: number }) => void;
}

type DecryptStatus = 'idle' | 'waiting' | 'signing' | 'decrypting' | 'done';

type VoteStatus = 'idle' | 'encrypting' | 'signing' | 'confirming' | 'decrypting_avg' | 'getting_rating' | 'success';

const VoteProcessingOverlay = ({ status, dappName }: { status: VoteStatus; dappName: string }) => {
  const steps = [
    { key: 'encrypting', label: 'Encrypting' },
    { key: 'signing', label: 'Signing' },
    { key: 'confirming', label: 'Confirming' },
    { key: 'decrypting_avg', label: 'Decrypting' },
    { key: 'getting_rating', label: 'Finishing' },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);
  const progress = Math.max(0, ((currentIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl p-6 max-w-xs w-full shadow-lg space-y-5">
        {}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-muted" />
            <div 
              className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" 
            />
          </div>
          <p className="text-sm font-medium">
            {steps[currentIndex]?.label || 'Processing'}...
          </p>
        </div>

        {}
        <div className="space-y-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Step {currentIndex + 1}/{steps.length}</span>
            <span>{dappName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VoteModal = ({ isOpen, onClose, dappName, dappId, currentVotes, onVote }: VoteModalProps) => {
  const { isConnected, address, network } = useWallet();
  const [voteAmount, setVoteAmount] = useState<string>('10');
  const [selectedScore, setSelectedScore] = useState<number>(5);
  const [userBalance, setUserBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [votingCaps, setVotingCaps] = useState({ perTxCap: '1000', dailyCap: '5000' });
  const [userDailyVotes, setUserDailyVotes] = useState('0');
  const [pricePerVote, setPricePerVote] = useState('10');
  const [userVoteCount, setUserVoteCount] = useState<number | null>(null);
  const [maxVotes, setMaxVotes] = useState(3);
  const [dappScores, setDappScores] = useState({ average: 0, count: 0, uniqueVoters: 0 });
  const [encryptionInfoOpen, setEncryptionInfoOpen] = useState(false);
  
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [decryptedBalance, setDecryptedBalance] = useState<number | null>(null);
  const [decryptStatus, setDecryptStatus] = useState<DecryptStatus>('idle');
  const [hasPendingDecryption, setHasPendingDecryption] = useState(false);
  
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [voteTxHash, setVoteTxHash] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [decryptedAverage, setDecryptedAverage] = useState<number | null>(null);

  const { 
    isAvailable: relayerAvailable, 
    decryptFast: relayerDecryptFast,
    requestDecryption: relayerRequestDecryption,
    checkTarget: relayerCheckTarget,
  } = useFHERelayer();

  const isEVM = isEVMNetwork(network);
  
  const isFHEVoting = network === 'sepolia' && isEVM;

  const [fhevmReady, setFhevmReady] = useState(false);
  const [fhevmError, setFhevmError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;

      if (isFHEVoting) {
        
        try {
          const adapter = (window as any).__walletAdapter;
          if (adapter instanceof EVMWalletAdapter) {
            
            const voting = new ZappsVoting(adapter);
            await voting.initialize();
            setFhevmReady(true);
            
            const price = await voting.getVotePrice();
            setPricePerVote((Number(price) / 1e18).toString());
            
            const voteInfo = await voting.getUserVoteInfo(dappId, address);
            console.log('[VoteModal] User vote info from contract:', voteInfo);
            setUserVoteCount(Number(voteInfo.voteCount)); 
            
            const max = await voting.getMaxVotesPerTarget();
            console.log('[VoteModal] Max votes per target:', max);
            setMaxVotes(max);
            
            const targetData = await voting.getTargetData(dappId);
            console.log('[VoteModal] Target data from contract:', {
              count: targetData.count,
              average: Number(targetData.average),
              uniqueVoters: Number(targetData.uniqueVoters),
              totalVotes: Number(targetData.totalVotes)
            });
            
            const cachedScores = loadFHEScoresFromLocalStorage(dappId);
            const onChainAvg = Number(targetData.average) / 100;
            
            let displayAverage = onChainAvg;
            if (onChainAvg === 0 && cachedScores && (Date.now() - cachedScores.lastUpdate) < 3600000) {
              displayAverage = cachedScores.average;
              console.log('[VoteModal] Using cached scores from localStorage:', cachedScores);
            }
            
            setDappScores({ 
              average: displayAverage,
              count: Number(targetData.totalVotes), 
              uniqueVoters: Number(targetData.uniqueVoters)
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
            
            setNeedsApproval(false);
          }
        } catch (error) {
          console.error('Failed to fetch FHE contract data:', error);
          setFhevmError((error as Error).message || 'Failed to initialize FHEVM');
        }
      } else if (isEVM) {
        
        try {
          const { data, error } = await backend.profiles.getByWallet(address);

          if (!error && data) {
            setUserBalance(data.rvp_balance || 0);
          }
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      } else {
        
        const { data, error } = await backend.profiles.getByWallet(address);

        if (!error && data) {
          setUserBalance(data.rvp_balance || 0);
        }
      }
    };

    if (isOpen && address) {
      fetchBalance();
    }
  }, [isOpen, address, network, isEVM, isFHEVoting, dappId]);

  useEffect(() => {
    const checkAllowance = async () => {
      if (!address) return;

      try {
        const adapter = (window as any).__walletAdapter;
        if (adapter instanceof EVMWalletAdapter) {
          
          setNeedsApproval(false);
        }
      } catch (error) {
        console.error('Failed to check allowance:', error);
      }
    };

    if ((voteAmount && parseFloat(voteAmount) > 0) || isFHEVoting) {
      checkAllowance();
    }
  }, [voteAmount, selectedScore, isEVM, isFHEVoting, address, network]);

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

      toast({
        title: "Waiting for Signature",
        description: "Please sign the message in your wallet...",
      });

      setDecryptStatus('signing');

      const token = new ZappsToken(adapter);
      await token.initialize();

      setDecryptStatus('decrypting');
      toast({
        title: "Decrypting Balance",
        description: "Processing encrypted data...",
      });

      const balance = await token.decryptBalance(address);
      const decimals = await token.getDecimals();
      const formattedBalance = Number(balance) / Math.pow(10, decimals);

      setDecryptedBalance(formattedBalance);
      setUserBalance(formattedBalance);
      setBalanceHidden(false);
      setDecryptStatus('done');

      toast({
        title: "Balance Revealed",
        description: `Your ZVP balance: ${formattedBalance.toLocaleString()}`,
      });
    } catch (error: any) {
      console.error('[VoteModal] Balance decryption failed:', error);
      toast({
        title: "Decryption Failed",
        description: error.message || "Failed to reveal balance. Please try again.",
        variant: "destructive",
      });
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

  const handleApprove = async () => {
    if (!address || !isEVM || isFHEVoting) return; 

    setIsApproving(true);
    
    const amount = voteAmount;

    try {
      const adapter = (window as any).__walletAdapter;
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Invalid wallet adapter for EVM');
      }

      toast({
        title: "No Approval Needed",
        description: "ZVP tokens are soulbound and don't require approval.",
      });
      setNeedsApproval(false);
    } catch (error: any) {
      console.error('Approval check failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const saveFHEScoresToLocalStorage = (dappId: string, data: {
    average: number;
    count: number;
    uniqueVoters: number;
    lastUpdate: number;
  }) => {
    try {
      const storageKey = `fhe_rating_${dappId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('[FHE-Vote] Saved to localStorage:', { dappId, ...data });
    } catch (err) {
      console.error('[FHE-Vote] Error saving to localStorage:', err);
    }
  };

  const loadFHEScoresFromLocalStorage = (dappId: string): { average: number; count: number; uniqueVoters: number; lastUpdate: number } | null => {
    try {
      const storageKey = `fhe_rating_${dappId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('[FHE-Vote] Error loading from localStorage:', err);
    }
    return null;
  };

  const handleVote = async () => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vote",
        variant: "destructive"
      });
      return;
    }

    if (isFHEVoting) {
      
      if (userVoteCount >= maxVotes) {
        toast({
          title: "Vote Limit Reached",
          description: `Maximum ${maxVotes} votes per dApp`,
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);
      setVoteStatus('encrypting');
      logFHEVoteEvent('fhe_vote_attempt', { dappId, score: selectedScore, price: pricePerVote });

      try {
        const adapter = (window as any).__walletAdapter;
        if (!(adapter instanceof EVMWalletAdapter)) {
          throw new Error('Invalid wallet adapter');
        }

        const voting = new ZappsVoting(adapter);
        await voting.initialize();

        setVoteStatus('signing');

        const tx = await voting.vote(dappId, selectedScore, TargetType.DApp);
        
        setVoteStatus('confirming');
        
        await tx.wait();
        
        const txHash = tx.hash;
        setVoteTxHash(txHash);

        logFHEVoteEvent('fhe_vote_success', { txHash, dappId, score: selectedScore });
        
        const voteInfo = await voting.getUserVoteInfo(dappId, address!);
        setUserVoteCount(voteInfo.voteCount);

        setVoteStatus('decrypting_avg');

        let averageRating = 0;
        let totalVotes = 0;
        let uniqueVoters = 0;
        
        const targetData = await voting.getTargetData(dappId);
        totalVotes = Number(targetData.totalVotes);
        uniqueVoters = Number(targetData.uniqueVoters);
        
        console.log('[FHE-Vote] Requesting decryption for updated encrypted values...');
        
        const currentRelayerAvailable = relayerDecryptFast !== null && relayerRequestDecryption !== null;
        console.log('[FHE-Vote] Relayer available (direct check):', currentRelayerAvailable, 'hook state:', relayerAvailable);
        
        let decryptionRequested = false;
        
        if (currentRelayerAvailable || relayerAvailable) {
          
          console.log('[FHE-Vote] Using frontend relayer for decryption...');
          
          try {
            
            console.log('[FHE-Vote] Requesting decryption via relayer...');
            
            const decryptTxHash = await relayerRequestDecryption(dappId);
            if (decryptTxHash) {
              console.log('[FHE-Vote] requestDecryptionData TX:', decryptTxHash);
              decryptionRequested = true;
              
              await new Promise(r => setTimeout(r, 3000));
            }
            
            let fastResult = await relayerDecryptFast(dappId);
            
            if (fastResult?.success && fastResult.clearValues) {
              const sum = Number(fastResult.clearValues.sum);
              const count = Number(fastResult.clearValues.count);
              
              if (count > 0) {
                averageRating = sum / count;
                console.log('[FHE-Vote] Fast decrypt SUCCESS!', { sum, count, average: averageRating });
              }
            }
          } catch (relayerError) {
            console.warn('[FHE-Vote] Frontend relayer decryption failed:', relayerError);
          }
        }
        
        if (!decryptionRequested && !averageRating) {
          console.warn('[FHE-Vote] Relayer not available - will poll on-chain for decryption');
          decryptionRequested = true;
        }
        
        if (averageRating === 0) {
          setVoteStatus('getting_rating');
          
          const maxPolls = 30; 
          for (let i = 0; i < maxPolls; i++) {
            await new Promise(r => setTimeout(r, 4000));
            console.log(`[FHE-Vote] Poll attempt ${i + 1}/${maxPolls}...`);
            
            const refreshedData = await voting.getTargetData(dappId);
            const newAvg = Number(refreshedData.average) / 100;
            
            if (newAvg > 0) {
              averageRating = newAvg;
              totalVotes = Number(refreshedData.totalVotes);
              uniqueVoters = Number(refreshedData.uniqueVoters);
              console.log('[FHE-Vote] Poll success! Average:', averageRating);
              break;
            }
            
            if (relayerAvailable && relayerDecryptFast) {
              try {
                const retryResult = await relayerDecryptFast(dappId);
                if (retryResult?.success && retryResult.clearValues) {
                  const sum = Number(retryResult.clearValues.sum);
                  const count = Number(retryResult.clearValues.count);
                  if (count > 0) {
                    averageRating = sum / count;
                    console.log('[FHE-Vote] Fast decrypt retry SUCCESS!', { sum, count, average: averageRating });
                    break;
                  }
                }
              } catch (retryErr) {
                console.warn('[FHE-Vote] Fast decrypt retry failed:', retryErr);
              }
            }
          }
          
          if (averageRating === 0) {
            console.error('[FHE-Vote] Polling timeout - decryption not complete');
            toast({
              title: "Decryption Pending",
              description: "Vote recorded but decryption is still processing. Please check back later.",
              variant: "destructive"
            });
            setVoteStatus('idle');
            setIsSubmitting(false);
            return; 
          }
        }
        
        setDappScores({ 
          average: averageRating,
          count: totalVotes, 
          uniqueVoters: uniqueVoters
        });
        setDecryptedAverage(averageRating);
        
        saveFHEScoresToLocalStorage(dappId, {
          average: averageRating,
          count: totalVotes,
          uniqueVoters: uniqueVoters,
          lastUpdate: Date.now(),
        });
        
        console.log('[FHE-Vote] Saved to localStorage:', { averageRating, totalVotes, uniqueVoters });

        setVoteStatus('success');
        setShowSuccessModal(true);
        setIsSubmitting(false);

        onVote(1, { 
          average: averageRating, 
          count: totalVotes, 
          uniqueVoters: uniqueVoters 
        });

      } catch (error: any) {
        console.error('FHE vote failed:', error);
        toast({
          title: "Vote Failed",
          description: error.message || "Failed to cast encrypted vote",
          variant: "destructive"
        });
        logFHEVoteEvent('fhe_vote_fail', { reason: error.message, dappId });
        setVoteStatus('idle');
        setIsSubmitting(false);
      }
      return;
    }

    const amount = parseFloat(voteAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${isEVM ? 'ZVP' : 'RVP'} tokens`,
        variant: "destructive"
      });
      return;
    }

    if (isEVM && !isFHEVoting) {
      const perTxCapNum = parseFloat(votingCaps.perTxCap);
      const dailyCapNum = parseFloat(votingCaps.dailyCap);
      const dailyVotesNum = parseFloat(userDailyVotes);

      if (amount > perTxCapNum) {
        toast({
          title: "Amount Exceeds Limit",
          description: `Maximum per transaction: ${perTxCapNum} ZVP`,
          variant: "destructive"
        });
        return;
      }

      if (dailyVotesNum + amount > dailyCapNum) {
        toast({
          title: "Daily Limit Exceeded",
          description: `You've reached your daily voting limit (${dailyCapNum} ZVP)`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);
    logVoteEvent('vote_attempt', { step: 'vote', dappId, amount: voteAmount, network });

    try {
      
      await handleDatabaseVote(amount);
    } catch (error: any) {
      console.error('Vote failed:', error);
      toast({
        title: "Vote Failed",
        description: error.message || "There was an error processing your vote. Please try again.",
        variant: "destructive"
      });
      logVoteEvent('vote_fail_reason', { step: 'vote', reason: error.message, dappId, network });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatabaseVote = async (amount: number) => {
    
    const { data: existingVote } = await backend.votes.getUserVoteForDApp(address!, dappId);

    const isFirstVote = !existingVote;

    if (existingVote) {
      const { error: voteError } = await backend.votes.update(existingVote.id, { 
        vote_amount: existingVote.vote_amount + amount,
        updated_at: new Date().toISOString()
      });

      if (voteError) throw voteError;
    } else {
      const { error: voteError } = await backend.votes.create({
        dapp_id: dappId,
        user_id: address!,
        vote_amount: amount
      });

      if (voteError) throw voteError;
    }

    const { error: balanceError } = await backend.profiles.update(address!, { 
      rvp_balance: userBalance - amount 
    });

    if (balanceError) throw balanceError;

    if (isFirstVote) {
      const { data: profile } = await backend.profiles.getByWallet(address!);

      if (profile?.referred_by) {
        const { data: referralClaim } = await backend.referrals.getByReferrerAndReferred(
          profile.referred_by, 
          address!
        );

        if (referralClaim && !referralClaim.reward_claimed) {
          await backend.referrals.update(referralClaim.id, { 
            votes_count: 1,
            reward_claimed: true,
            claimed_at: new Date().toISOString()
          });

          const { data: referrerProfile } = await backend.profiles.getByWallet(profile.referred_by);

          if (referrerProfile) {
            await backend.profiles.update(profile.referred_by, { 
              rvp_balance: (referrerProfile.rvp_balance || 0) + 50 
            });
          }
        }
      }
    }

    setUserBalance(userBalance - amount);
    onVote(amount);

    toast({
      title: "Vote Successful!",
      description: `You voted with ${amount} RVP for ${dappName}`,
    });
    
    onClose();
  };

  const setMaxAmount = () => {
    if (isEVM) {
      
      const maxAllowed = Math.min(userBalance, parseFloat(votingCaps.perTxCap));
      setVoteAmount(maxAllowed.toString());
    } else {
      setVoteAmount(userBalance.toString());
    }
  };

  const tokenSymbol = isEVM ? 'ZVP' : 'RVP';

  const content = (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to vote
          </p>
        </div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-background to-accent/10 p-3">
              <div className="absolute inset-0 opacity-10" 
                   style={{
                     backgroundImage: 'linear-gradient(hsl(var(--accent) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent) / 0.1) 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                   }} 
              />
              <div className="relative space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Coins className="w-3 h-3" />
                  <p className="text-xs">Your {tokenSymbol}</p>
                  {isFHEVoting && (
                    <button 
                      onClick={handleRevealBalance}
                      disabled={isDecrypting}
                      className="ml-auto p-1 hover:bg-muted/50 rounded transition-colors"
                      title={balanceHidden ? "Reveal balance" : "Balance revealed"}
                    >
                      {isDecrypting ? (
                        <RotateCw className="w-3 h-3 animate-spin" />
                      ) : balanceHidden ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-primary" />
                      )}
                    </button>
                  )}
                </div>
                {isFHEVoting && balanceHidden ? (
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
              <div className="absolute inset-0 opacity-10" 
                   style={{
                     backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                   }} 
              />
              <div className="relative space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Vote className="w-3 h-3" />
                  <p className="text-xs">Total Votes</p>
                </div>
                <p className="text-xl font-bold">{isFHEVoting ? dappScores.count.toLocaleString() : currentVotes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {}
          {isFHEVoting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rate this dApp</label>
                <span className="text-xs text-muted-foreground">
                  {userVoteCount ?? 0}/{maxVotes} votes used
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
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Vote Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={voteAmount}
                  onChange={(e) => setVoteAmount(e.target.value)}
                  placeholder={`Enter ${tokenSymbol} amount`}
                  className="h-12 pr-16 text-base"
                  min="1"
                  max={userBalance}
                />
              <Button
                variant="ghost"
                size="sm"
                onClick={setMaxAmount}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-xs"
              >
                MAX
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">
                1 {tokenSymbol} = 1 Vote Power
              </p>
            </div>
            {isEVM && (
              <p className="text-xs text-muted-foreground">
                Daily limit: {userDailyVotes}/{votingCaps.dailyCap} {tokenSymbol} • Per tx: {votingCaps.perTxCap} {tokenSymbol}
              </p>
            )}
          </div>
          )}

          {}
          <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
            <div className="relative space-y-2">
              {isFHEVoting ? (
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
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">You will vote with</p>
                    <p className="text-lg font-bold">{voteAmount || '0'} {tokenSymbol}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Vote className="w-5 h-5 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {}
          {isFHEVoting && userVoteCount >= maxVotes && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Vote Limit Reached</p>
                  <p className="text-xs text-muted-foreground">
                    You've used all {maxVotes} votes for this dApp. Maximum {maxVotes} encrypted votes per user per dApp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isFHEVoting ? (
            // FHE Voting: Soulbound ZVP - No approval needed
            userVoteCount >= maxVotes ? (
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
                disabled={userBalance < parseFloat(pricePerVote) || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>
                      {voteStatus === 'encrypting' && 'Encrypting...'}
                      {voteStatus === 'signing' && 'Sign in wallet...'}
                      {voteStatus === 'confirming' && 'Confirming...'}
                      {voteStatus === 'decrypting_avg' && 'Decrypting average...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Cast Encrypted Vote ({pricePerVote} ZVP)
                  </>
                )}
              </Button>
            )
          ) : (
            // Regular EVM Voting
            isEVM && needsApproval ? (
              <Button 
                onClick={handleApprove}
                className="w-full h-12 gradient-primary glow-effect"
                disabled={!voteAmount || parseFloat(voteAmount) <= 0 || isApproving}
              >
                {isApproving ? 'Approving...' : `Approve ${tokenSymbol}`}
              </Button>
            ) : (
              <Button 
                onClick={handleVote}
                className="w-full h-12 gradient-primary glow-effect"
                disabled={!voteAmount || parseFloat(voteAmount) <= 0 || parseFloat(voteAmount) > userBalance || isSubmitting}
              >
                <Vote className="w-4 h-4" />
                {isSubmitting ? 'Processing...' : 'Cast Vote'}
              </Button>
            )
          )}
        </>
      )}
    </div>
  );

  // Success modal content - Clean minimal design
  const successContent = (
    <div className="flex flex-col items-center py-4 space-y-4">
      {/* Success Icon */}
      <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="w-7 h-7 text-green-500" />
      </div>

      {/* Message */}
      <div className="text-center space-y-1">
        <p className="font-semibold">Vote Recorded</p>
        <p className="text-xs text-muted-foreground">
          {selectedScore}★ encrypted on-chain
        </p>
      </div>
      
      {/* Average Rating - Compact */}
      {decryptedAverage !== null && decryptedAverage > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
          <span className="text-lg font-bold">{decryptedAverage.toFixed(1)}</span>
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-xs text-muted-foreground">avg</span>
        </div>
      )}
      
      {decryptedAverage === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RotateCw className="w-3 h-3 animate-spin" />
          <span>Calculating average...</span>
        </div>
      )}
      
      {/* Transaction Link - Minimal */}
      {voteTxHash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${voteTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View tx <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
      
      <Button
        onClick={() => {
          setShowSuccessModal(false);
          setVoteStatus('idle');
          onClose();
        }}
        size="sm"
        className="w-full"
      >
        Done
      </Button>
    </div>
  );

  // Show processing overlay when vote is in progress (locks page)
  const isProcessing = voteStatus !== 'idle' && voteStatus !== 'success';
  
  if (isProcessing) {
    return <VoteProcessingOverlay status={voteStatus} dappName={dappName} />;
  }

  // Show success modal if vote completed
  if (showSuccessModal) {
    if (isMobile) {
      return (
        <Drawer open={isOpen} onOpenChange={() => {
          setShowSuccessModal(false);
          setVoteStatus('idle');
          onClose();
        }}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Vote Recorded
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              {successContent}
            </div>
          </DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={isOpen} onOpenChange={() => {
        setShowSuccessModal(false);
        setVoteStatus('idle');
        onClose();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Vote Recorded
            </DialogTitle>
          </DialogHeader>
          {successContent}
        </DialogContent>
      </Dialog>
    );
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-lg">Cast {isEVM ? 'Blockchain' : 'Encrypted'} Vote</DrawerTitle>
            <DrawerDescription className="text-xs">
              {isEVM 
                ? `Vote securely on ${network} with ${tokenSymbol} tokens`
                : 'Your vote will be encrypted end-to-end using Zama\'s FHE'
              }
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cast {isEVM ? 'Blockchain' : 'Encrypted'} Vote</DialogTitle>
          <DialogDescription>
            {isEVM 
              ? `Vote securely on ${network} with ${tokenSymbol} tokens. Your vote will be recorded on-chain.`
              : 'Your vote will be encrypted end-to-end using Zama\'s FHE before being processed on-chain'
            }
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
