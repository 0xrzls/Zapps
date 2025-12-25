import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { backend } from '@/services';
import { useToast } from '@/hooks/use-toast';
import { WalletFactory } from '@/lib/wallet/factory';
import { WalletAdapter, WalletType, NetworkType, WalletContextType } from '@/lib/wallet/types';
import { DEFAULT_NETWORK, getNetworkConfig, FEATURES } from '@/lib/wallet/config';
import { ReferralInviteModal } from '@/components/ReferralInviteModal';
import { ClaimReferralRewardModal } from '@/components/ClaimReferralRewardModal';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [network, setNetwork] = useState<NetworkType>(DEFAULT_NETWORK);
  const [balance, setBalance] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [adapter, setAdapter] = useState<WalletAdapter | null>(null);
  const [showReferralInvite, setShowReferralInvite] = useState(false);
  const [showClaimReferral, setShowClaimReferral] = useState(false);
  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(null);
  const [pendingReferralReward] = useState<number>(20);
  const { toast } = useToast();

  useEffect(() => {
    if (!adapter) return;

    (window as any).__walletAdapter = adapter;

    const unsubscribeAccount = adapter.onAccountChange((newAddress) => {
      setAddress(newAddress);
      if (newAddress) {
        localStorage.setItem('walletAddress', newAddress);
      }
    });

    const unsubscribeDisconnect = adapter.onDisconnect(() => {
      setIsConnected(false);
      setAddress(null);
      setWalletType(null);
      setAdapter(null);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    });

    return () => {
      unsubscribeAccount();
      unsubscribeDisconnect();
    };
  }, [adapter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      setPendingReferralCode(refCode);
      
      const savedAddress = localStorage.getItem('walletAddress');
      if (!savedAddress) {
        setShowReferralInvite(true);
      }
    }
  }, []);

  useEffect(() => {
    const savedNetwork = localStorage.getItem('network') as NetworkType | null;
    if (savedNetwork) {
      setNetwork(savedNetwork);
    }

    const restoreWallet = async () => {
      const savedWalletType = localStorage.getItem('walletType');
      const savedAddress = localStorage.getItem('walletAddress');

      if (savedWalletType && savedAddress) {
        try {
          console.log('Restoring wallet:', { savedWalletType, savedAddress });
          
          if (!WalletFactory.isWalletAvailable(savedWalletType as WalletType)) {
            console.log('Wallet no longer available, clearing saved data');
            localStorage.removeItem('walletType');
            localStorage.removeItem('walletAddress');
            return;
          }

          const restoredAdapter = WalletFactory.create(
            savedWalletType as WalletType,
            savedNetwork || DEFAULT_NETWORK
          );

          if (savedWalletType === 'metamask' && (window as any).ethereum?.isMetaMask) {
            try {
              const ethereum = (window as any).ethereum;
              const accounts = await ethereum.request({ method: 'eth_accounts' });
              
              if (accounts && accounts.length > 0 && accounts[0] === savedAddress) {
                await restoredAdapter.connect();
                
                setAdapter(restoredAdapter);
                setIsConnected(true);
                setAddress(accounts[0]);
                setWalletType(savedWalletType as WalletType);
                
                const bal = await restoredAdapter.getBalance();
                setBalance(bal);
                
                console.log('MetaMask wallet restored successfully:', accounts[0]);
              } else {
                console.log('MetaMask account mismatch or no accounts, clearing saved data');
                localStorage.removeItem('walletType');
                localStorage.removeItem('walletAddress');
              }
            } catch (error) {
              console.log('MetaMask restore failed, user needs to reconnect:', error);
              localStorage.removeItem('walletType');
              localStorage.removeItem('walletAddress');
            }
          }
          else if (savedWalletType === 'zama') {
            try {
              await restoredAdapter.connect();
              const currentAddress = restoredAdapter.getPublicKey();
              
              if (currentAddress === savedAddress) {
                setAdapter(restoredAdapter);
                setIsConnected(true);
                setAddress(currentAddress);
                setWalletType(savedWalletType as WalletType);
                
                const bal = await restoredAdapter.getBalance();
                setBalance(bal);
                
                console.log('Zama wallet restored successfully:', currentAddress);
              } else {
                console.log('Address mismatch, clearing saved data');
                localStorage.removeItem('walletType');
                localStorage.removeItem('walletAddress');
              }
            } catch (error) {
              console.log('Zama restore failed, user needs to reconnect');
              localStorage.removeItem('walletType');
              localStorage.removeItem('walletAddress');
            }
          }
        } catch (error) {
          console.error('Failed to restore wallet:', error);
          localStorage.removeItem('walletType');
          localStorage.removeItem('walletAddress');
        }
      }
    };

    restoreWallet();
  }, []);

  const connectWallet = async (type: WalletType) => {
    try {
      if (!WalletFactory.isWalletAvailable(type)) {
        toast({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} not found`,
          description: `Please install ${type.charAt(0).toUpperCase() + type.slice(1)} wallet extension`,
          variant: "destructive"
        });
        return;
      }

      const newAdapter = WalletFactory.create(type, network);
      
      const walletAddress = await newAdapter.connect();
      
      const networkConfig = getNetworkConfig(network);
      toast({
        title: `Connected to ${networkConfig.nativeToken}`,
        description: `Network: ${network}`,
      });
      
      const { data: existingProfile, error: profileFetchError } = await backend.profiles.getByWallet(walletAddress);

      if (profileFetchError) {
        console.error('Error fetching profile:', profileFetchError);
      }

      if (!existingProfile) {
        const referralCode = localStorage.getItem('referralCode');
        
        let referredBy: string | null = null;
        if (referralCode) {
          const { data: referrer } = await backend.profiles.getByReferralCode(referralCode);
          
          if (referrer && referrer.wallet_address) {
            referredBy = referrer.wallet_address;
          }
        }

        const { error: profileError } = await backend.profiles.create({
          wallet_address: walletAddress,
          referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          referred_by: referredBy
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw profileError;
        }

        if (referredBy) {
          const { error: claimError } = await backend.referrals.create({
            referrer_wallet: referredBy,
            referred_wallet: walletAddress
          });
          
          if (claimError) {
            console.error('Error creating referral claim:', claimError);
          }
        }

        const { error: rewardsError } = await backend.userRewards.upsert({
          wallet_address: walletAddress
        });
        
        if (rewardsError) {
          console.error('Error creating user rewards:', rewardsError);
        }

        localStorage.removeItem('referralCode');
        
        toast({
          title: "Welcome! 🎉",
          description: "Your wallet has been connected!",
        });

        if (referredBy) {
          setTimeout(() => {
            setShowClaimReferral(true);
          }, 1000);
        }
      } else {
        toast({
          title: "Welcome back! 👋",
          description: "Your wallet has been connected successfully",
        });
      }

      setAdapter(newAdapter);
      setAddress(walletAddress);
      setWalletType(type);
      setIsConnected(true);
      setShowWalletModal(false);
      localStorage.setItem('walletAddress', walletAddress);
      localStorage.setItem('walletType', type);

      try {
        const walletBalance = await newAdapter.getBalance();
        setBalance(walletBalance);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  const disconnectWallet = async () => {
    if (adapter) {
      await adapter.disconnect();
    }
    
    setAdapter(null);
    setAddress(null);
    setWalletType(null);
    setIsConnected(false);
    setBalance(0);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    toast({
      title: "Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const switchNetwork = async (newNetwork: NetworkType) => {
    if (isConnected) {
      toast({
        title: "Network switch requires reconnection",
        description: "Please disconnect and reconnect your wallet to switch networks",
        variant: "destructive"
      });
      return;
    }
    
    setNetwork(newNetwork);
    localStorage.setItem('network', newNetwork);
    
    const networkConfig = getNetworkConfig(newNetwork);
    toast({
      title: "Network switched",
      description: `Now using ${networkConfig.nativeToken} ${newNetwork}`,
    });
  };

  const signMessage = async (message: string): Promise<Uint8Array | null> => {
    if (!adapter) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return null;
    }

    try {
      return await adapter.signMessage(message);
    } catch (error: any) {
      toast({
        title: "Failed to sign message",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const sendTransaction = async (transaction: any): Promise<string | null> => {
    if (!adapter) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return null;
    }

    try {
      return await adapter.sendTransaction(transaction);
    } catch (error: any) {
      toast({
        title: "Transaction failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleClaimReferralReward = async () => {
    if (!address || !adapter) return;
    
    const referralCode = localStorage.getItem('referralCode') || pendingReferralCode;
    if (!referralCode) return;
    
    const { data: referrer } = await backend.profiles.getByReferralCode(referralCode);
    
    if (!referrer?.wallet_address) return;
    
    try {
      const { EVMWalletAdapter } = await import("@/lib/wallet/adapters/EVMWalletAdapter");
      
      if (!(adapter instanceof EVMWalletAdapter)) {
        throw new Error('Only EVM wallets are supported for referral rewards');
      }

      const provider = adapter.getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      const { registerReferral } = await import("@/lib/contracts/rewardManagerV2");
      
      await registerReferral(provider, network, referrer.wallet_address);
      
      toast({
        title: "Reward Claimed!",
        description: `You received ${pendingReferralReward} ZVP (encrypted on-chain)`,
      });
    } catch (error: any) {
      console.error('Failed to claim referral reward:', error);
      toast({
        title: "Failed to claim reward",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        publicKey: address,
        walletType,
        network,
        balance,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        signMessage,
        sendTransaction,
        showWalletModal,
        setShowWalletModal,
        openClaimReferralModal: () => setShowClaimReferral(true),
      }}
    >
      {children}
      
      <ReferralInviteModal
        open={showReferralInvite}
        onClose={() => setShowReferralInvite(false)}
        onConnect={() => {
          setShowReferralInvite(false);
          setShowWalletModal(true);
        }}
        referralReward={pendingReferralReward}
      />
      
      <ClaimReferralRewardModal
        open={showClaimReferral}
        onClose={() => setShowClaimReferral(false)}
        onClaim={handleClaimReferralReward}
        referralReward={pendingReferralReward}
      />
    </WalletContext.Provider>
  );
};