import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/services";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import { ZappsRewards, type DailyLoginInfo } from "@/lib/contracts/zappsRewards";
import { ZappsToken, ZAPPS_ADDRESSES } from "@/lib/contracts/zappsContracts";
import { EVMWalletAdapter } from "@/lib/wallet/adapters/EVMWalletAdapter";
import { 
  Gift, 
  Users, 
  BookOpen,
  Copy,
  CheckCircle2,
  Calendar,
  Wallet,
  Sparkles,
  Share2,
  Award,
  Shield,
  Lock,
  Info,
  Key,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCw,
  Loader2
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { SocialBindingDialog } from "@/components/SocialBindingDialog";
import { formatDistanceToNow } from "date-fns";

const Rewards = () => {
  const { isConnected, address, setShowWalletModal, network } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [dailyLoginInfo, setDailyLoginInfo] = useState<DailyLoginInfo | null>(null);
  const [dailyRewardAmount, setDailyRewardAmount] = useState<number>(10);
  const [referrerReward, setReferrerReward] = useState<number>(30);
  const [referredReward, setReferredReward] = useState<number>(20);
  const [maxReferrals, setMaxReferrals] = useState<number>(3);
  const [pendingReferrer, setPendingReferrer] = useState<string | null>(null);
  const [showFHEDetails, setShowFHEDetails] = useState(false);
  const [oneTimeRewards, setOneTimeRewards] = useState<any[]>([]);
  const [questCompletions, setQuestCompletions] = useState<Record<string, any>>({});
  const [showSocialBinding, setShowSocialBinding] = useState(false);
  const [bindingPlatform, setBindingPlatform] = useState<"twitter" | "discord">("twitter");
  
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [decryptedBalance, setDecryptedBalance] = useState<number | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);
  
  const isSepolia = network === 'sepolia';
  
  const referralInfo = { 
    hasUsedReferral: dailyLoginInfo?.referrer !== ethers.ZeroAddress,
    referralCount: 0,
    totalEarned: 0,
    decryptionPending: false,
  };
  const referralRewards = { referrerReward, referredReward };
  const contractSetup = { allReady: isSepolia };
  
  const completeTask = async (): Promise<any> => { 
    throw new Error('Not implemented - use ZappsRewards.completeQuest'); 
  };
  const requestMyDailyLoginDecryption = async (): Promise<any> => { 
    throw new Error('FHE decryption not yet implemented'); 
  };
  const requestMyReferralDecryption = async (): Promise<any> => { 
    throw new Error('FHE decryption not yet implemented'); 
  };
  const claimDailyLogin = async (): Promise<any> => { 
    throw new Error('Use handleDailyClaim instead'); 
  };
  const registerReferral = async (provider: any, network: any, referrer: string) => {
    const rewards = new ZappsRewards(provider);
    await rewards.connect();
    return rewards.registerReferral(referrer);
  };

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && address) {
      
      backend.profiles.getByReferralCode(refCode)
        .then(({ data }) => {
          if (data && data.wallet_address !== address) {
            setPendingReferrer(data.wallet_address);
          }
        });
    }
  }, [searchParams, address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchRewardsData();
      fetchContractData();
      fetchOneTimeRewards();
      checkBalanceExists();
    }
  }, [isConnected, address, network]);

  const checkBalanceExists = async () => {
    if (!address || !isSepolia) return;
    
    try {
      setBalanceLoading(true);
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      
      const provider = new ethers.BrowserProvider(ethereum);
      const tokenContract = new ethers.Contract(
        ZAPPS_ADDRESSES.TOKEN,
        ['function confidentialBalanceOf(address) view returns (bytes32)'],
        provider
      );
      
      const handle = await tokenContract.confidentialBalanceOf(address);
      setHasBalance(handle !== ethers.ZeroHash);
    } catch (error) {
      console.error('[Rewards] Error checking balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleDecryptBalance = async () => {
    if (!address || !isSepolia) return;
    
    setIsDecrypting(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('No wallet found');
      
      const adapter = new EVMWalletAdapter('metamask', 'sepolia');
      await adapter.connect();
      
      const zappsToken = new ZappsToken(adapter);
      await zappsToken.initialize();
      
      const balance = await zappsToken.decryptBalance(address);
      const decimals = await zappsToken.getDecimals();
      
      setDecryptedBalance(Number(balance) / Math.pow(10, decimals));
      setBalanceHidden(false);
      
      toast({
        title: "Balance Decrypted",
        description: `Your ZVP balance: ${(Number(balance) / Math.pow(10, decimals)).toFixed(2)}`,
      });
    } catch (error: any) {
      console.error('[Rewards] Decrypt balance error:', error);
      toast({
        title: "Decryption Failed",
        description: error?.message || "Failed to decrypt balance",
        variant: "destructive"
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const fetchOneTimeRewards = async () => {
    if (!address) return;
    
    try {
      
      const { data: baseCampaigns, error } = await backend.campaigns.getOneTimeRewards({ limit: 1 });
      
      if (error) throw error;

      const campaignsWithQuests = await Promise.all(
        (baseCampaigns || []).map(async (c) => {
          const { data: quests } = await backend.quests.getByCampaign(c.id);
          return { ...c, campaign_quests: quests || [] };
        })
      );
      
      console.log('Fetched latest OneTime campaign (with quests attached):', campaignsWithQuests);
      
      setOneTimeRewards(campaignsWithQuests || []);
      
      const questIds = campaignsWithQuests?.flatMap(c => (c.campaign_quests || []).map((q: any) => q.id)) || [];
      if (questIds.length > 0) {
        const { data: completions } = await backend.questCompletions.getByUserAndQuestIds(address, questIds);
        
        const completionsMap: Record<string, any> = {};
        completions?.forEach(c => {
          completionsMap[c.quest_id] = c;
        });
        setQuestCompletions(completionsMap);
      }
    } catch (error) {
      console.error('Error fetching one-time rewards:', error);
    }
  };
  const handleQuestAction = async (quest: any, campaign: any) => {
    const completion = questCompletions[quest.id];
    
    if (completion?.verified) {
      toast({
        title: "Already Claimed",
        description: "You have already claimed this reward",
        variant: "destructive"
      });
      return;
    }
    
    if (completion?.completed) {
      await handleClaimReward(quest, campaign);
      return;
    }
    
    const questTitle = (quest.title || '').toLowerCase();
    const questDesc = (quest.description || '').toLowerCase();
    const isTwitterQuest = questTitle.includes('follow') || questTitle.includes('twitter') || questTitle.includes('x ') || questDesc.includes('twitter') || questDesc.includes('follow');
    const isDiscordQuest = questTitle.includes('discord') || questDesc.includes('discord');
    
    if (isTwitterQuest || isDiscordQuest) {
      
      if (profile) {
        const hasTwitter = profile.twitter_connected;
        const hasDiscord = profile.discord_connected;
        
        if (isTwitterQuest && !hasTwitter) {
          
          setBindingPlatform('twitter');
          setShowSocialBinding(true);
          return;
        }
        
        if (isDiscordQuest && !hasDiscord) {
          
          setBindingPlatform('discord');
          setShowSocialBinding(true);
          return;
        }
      }
    }
    
    if (quest.link) {
      window.open(quest.link, '_blank');
      
      await backend.questCompletions.upsert({
        quest_id: quest.id,
        user_id: address,
        completed: true,
        completed_at: new Date().toISOString()
      });
      
      toast({
        title: "Task Opened",
        description: "Complete the task and click Claim to get your reward",
      });
      
      fetchOneTimeRewards();
    }
  };
  
  const handleClaimReward = async (quest: any, campaign: any) => {
    if (!address) return;
    
    toast({
      title: "Coming Soon",
      description: "Quest claiming is being migrated to ZappsRewards contract",
      variant: "default"
    });
  };

  const getProvider = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('No ethereum provider found');
    }
    return new ethers.BrowserProvider(ethereum);
  };

  const fetchContractData = async () => {
    if (!address || !isSepolia) return;
    
    try {
      const provider = await getProvider();
      const rewards = new ZappsRewards(provider);
      await rewards.connect();
      
      const dailyInfo = await rewards.getDailyLoginInfo(address);
      setDailyLoginInfo(dailyInfo);
      
      const dailyRewardBigInt = await rewards.getDailyReward();
      const referrerRewardBigInt = await rewards.getReferrerReward();
      const referredRewardBigInt = await rewards.getReferredReward();
      
      console.log('[ZappsRewards] Raw values:', { 
        dailyRewardBigInt: dailyRewardBigInt.toString(),
        referrerRewardBigInt: referrerRewardBigInt.toString(),
        referredRewardBigInt: referredRewardBigInt.toString()
      });
      
      const isWei = dailyRewardBigInt > 1000000000000n; 
      
      if (isWei) {
        
        setDailyRewardAmount(Number(ethers.formatUnits(dailyRewardBigInt, 18)));
        setReferrerReward(Number(ethers.formatUnits(referrerRewardBigInt, 18)));
        setReferredReward(Number(ethers.formatUnits(referredRewardBigInt, 18)));
      } else {
        
        setDailyRewardAmount(Number(dailyRewardBigInt));
        setReferrerReward(Number(referrerRewardBigInt));
        setReferredReward(Number(referredRewardBigInt));
      }
      
      const maxRefs = await rewards.getMaxReferrals();
      setMaxReferrals(maxRefs);
      
      console.log('[ZappsRewards] Contract data loaded:', { 
        dailyInfo, 
        dailyRewardAmount: isWei ? Number(ethers.formatUnits(dailyRewardBigInt, 18)) : Number(dailyRewardBigInt),
        isWei
      });
    } catch (error: any) {
      console.error('[ZappsRewards] Error fetching contract data:', error);
      toast({
        title: "Contract Error",
        description: "Failed to fetch rewards data. Make sure you're on Sepolia.",
        variant: "destructive"
      });
    }
  };

  const fetchRewardsData = async () => {
    if (!address) return;

    const { data: rewardsData } = await backend.userRewards.getByWallet(address);

    if (!rewardsData) {
      await backend.userRewards.upsert({ wallet_address: address });
      fetchRewardsData();
      return;
    }

    setRewards(rewardsData);

    const { data: profileData } = await backend.profiles.getByWallet(address);
    setProfile(profileData);
  };

  const canClaimDaily = () => {
    if (dailyLoginInfo) {
      return dailyLoginInfo.canClaim;
    }
    return false;
  };

  const canPostToday = () => {
    if (!rewards?.last_twitter_post) return true;
    const lastPost = new Date(rewards.last_twitter_post);
    const now = new Date();
    return lastPost.toDateString() !== now.toDateString();
  };

  const handleDailyClaim = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    
    if (!isSepolia) {
      toast({
        title: "Unsupported network",
        description: "Daily reward only available on Sepolia",
        variant: "destructive"
      });
      return;
    }
    
    if (!canClaimDaily()) {
      toast({
        title: "Already claimed!",
        description: "You can claim again in 24 hours",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const provider = await getProvider();
      const rewards = new ZappsRewards(provider);
      await rewards.connect();
      
      console.log('[ZappsRewards] Calling claimDailyReward...');
      const tx = await rewards.claimDailyReward();
      
      console.log('[ZappsRewards] Transaction submitted:', tx.hash);
      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });
      
      const receipt = await tx.wait();
      console.log('[ZappsRewards] Transaction confirmed:', receipt);
      
      toast({
        title: "Daily Reward Claimed!",
        description: `+${dailyRewardAmount} ZVP tokens received`,
      });
      
      await Promise.all([
        fetchContractData(),
        checkBalanceExists(),
        fetchRewardsData()
      ]);
    } catch (error: any) {
      console.error('[ZappsRewards] Daily claim error:', error);
      
      let errorMessage = "Failed to claim daily reward";
      const short = (error?.shortMessage || error?.message || '').toLowerCase();
      
      if (short.includes('user rejected') || short.includes('user denied')) {
        errorMessage = "Transaction rejected by user";
      } else if (short.includes('alreadyclaimed')) {
        errorMessage = "You've already claimed today. Come back tomorrow!";
      } else if (short.includes('execution reverted')) {
        errorMessage = "Claim reverted. You may have already claimed today.";
      }
      
      toast({
        title: "Claim Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReferralRegister = async () => {
    if (!isConnected || !pendingReferrer) {
      return;
    }

    if (referralInfo?.hasUsedReferral) {
      toast({
        title: "Already used referral",
        description: "You've already registered with a referral code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const provider = await getProvider();
      const tx = await registerReferral(provider, network, pendingReferrer);
      
      toast({
        title: "Transaction Submitted",
        description: "Registering referral...",
      });
      
      await tx.wait();
      
      toast({
        title: "Referral Registered!",
        description: `You received +${referralRewards.referredReward} ZVP! Your referrer got +${referralRewards.referrerReward} ZVP`,
      });
      
      setPendingReferrer(null);
      
      await Promise.all([
        fetchContractData(),
        checkBalanceExists()
      ]);
    } catch (error: any) {
      console.error('Referral registration error:', error);
      let errorMessage = "Failed to register referral";
      const short = error?.shortMessage || error?.message || '';
      if (short.toLowerCase().includes('user rejected')) {
        errorMessage = "Transaction rejected by user";
      } else if (short.toLowerCase().includes('execution reverted')) {
        errorMessage = "Registration reverted. You may have already used a referral or the referrer has reached their limit.";
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDailyDecryption = async () => {
    if (!isConnected) return;
    
    toast({
      title: "Coming Soon",
      description: "FHE decryption for daily stats is being implemented",
    });
  };

  const handleRequestReferralDecryption = async () => {
    if (!isConnected) return;
    
    toast({
      title: "Coming Soon",
      description: "FHE decryption for referral stats is being implemented",
    });
  };

  const generateTweetText = () => {
    const texts = [
      "Just discovered @zamaverse - the ultimate ecosystem for exploring Web3 dApps! 🚀 Gamified learning, voting, and rewards all in one place! #Zamaverse #Web3",
      "Exploring the @zamaverse ecosystem! 🌟 Amazing platform to discover, learn, and engage with Web3 dApps. Join me in this journey! #Zamaverse #Web3Community",
      "Love how @zamaverse makes Web3 accessible and fun! 🎮 Earn rewards while learning about the Zamaverse ecosystem. Check it out! #Zamaverse #Web3Gaming",
      "Building the future with @zamaverse! 💎 The best platform to explore dApps, earn rewards, and connect with the Web3 community. #Zamaverse #DeFi",
      "Just earned rewards on @zamaverse! 🎁 This gamified platform makes learning about Web3 so engaging. Join the revolution! #Zamaverse #CryptoRewards"
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  const handleDailyPost = async () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    if (!canPostToday()) {
      toast({
        title: "Already posted today!",
        description: "Come back tomorrow for another post",
        variant: "destructive"
      });
      return;
    }

    const tweetText = generateTweetText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    window.open(twitterUrl, "_blank");

    setLoading(true);
    try {
      await backend.userRewards.update(address, { last_twitter_post: new Date().toISOString() });

      toast({
        title: "Daily Post Complete!",
        description: "Thanks for sharing! Keep engaging to earn more rewards.",
      });

      fetchRewardsData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getNextClaimTime = () => {
    if (!dailyLoginInfo) return 'Loading...';
    if (dailyLoginInfo.lastClaimTime === 0n) return 'Never claimed';
    const lastClaimMs = Number(dailyLoginInfo.lastClaimTime) * 1000;
    const nextClaimMs = lastClaimMs + (24 * 60 * 60 * 1000);
    return formatDistanceToNow(new Date(nextClaimMs), { addSuffix: true });
  };

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl">
      {}
      <div className="relative mb-6 p-5 rounded-xl overflow-hidden glass-card-subtle">
        {}
        <div className="absolute top-2 right-2 flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
        
        <div className="relative space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Rewards Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Earn ZVP & Get Rewarded</h1>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Complete activities to earn Zamaverse Voting Power
          </p>
          {isConnected ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm">
              {}
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 shrink-0">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                    {balanceLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : balanceHidden ? (
                      <span className="tracking-wider">••••••</span>
                    ) : decryptedBalance !== null ? (
                      decryptedBalance.toFixed(2)
                    ) : (
                      <span className="text-muted-foreground">Encrypted</span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">ZVP Balance (FHE)</div>
                </div>
              </div>
              
              {}
              <div className="flex gap-2 shrink-0">
                {decryptedBalance !== null ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 gap-1.5"
                    onClick={() => setBalanceHidden(!balanceHidden)}
                  >
                    {balanceHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-xs">{balanceHidden ? 'Show' : 'Hide'}</span>
                  </Button>
                ) : hasBalance ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 gap-1.5 border-primary/30 hover:bg-primary/10"
                    onClick={handleDecryptBalance}
                    disabled={isDecrypting || balanceLoading}
                  >
                    {isDecrypting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Decrypting...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span className="text-xs">Decrypt</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground px-2">No balance yet</div>
                )}
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowWalletModal(true)} size="sm" className="gap-2">
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-bold">Daily Activities</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3">
          {}
          <div className="w-full md:min-w-0 snap-start snap-center group p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm hover:shadow-glow flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                +{dailyRewardAmount} ZVP
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">Daily Claim</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Claim every 24 hours
            </p>
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${canClaimDaily() ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {dailyLoginInfo?.decryptionPending ? 'Decrypting...' : canClaimDaily() ? 'Ready!' : 'Claimed'}
                </span>
              </div>
              <Progress value={canClaimDaily() ? 100 : 0} className="h-1" />
              {dailyLoginInfo && (
                <div className="text-[9px] text-muted-foreground pt-1">
                  Streak: {dailyLoginInfo.streakCount} | Total: {dailyLoginInfo.totalClaimed}
                </div>
              )}
            </div>
            <Button 
              onClick={handleDailyClaim} 
              disabled={!isConnected || (isConnected && !canClaimDaily()) || dailyLoginInfo?.decryptionPending || loading}
              className="w-full h-8 text-xs"
              size="sm"
            >
              {!isConnected ? (
                'Connect Wallet'
              ) : loading ? (
                'Processing...'
              ) : canClaimDaily() ? (
                <>
                  <Gift className="w-3 h-3 mr-1" />
                  Claim Now
                </>
              ) : (
                getNextClaimTime()
              )}
            </Button>
          </div>

          {}
          <div className="w-full md:min-w-0 snap-start snap-center group p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm hover:shadow-glow flex-shrink-0">
  <div className="flex items-center justify-between mb-3">
  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
      <FaXTwitter className="w-3.5 h-3.5 text-primary" />
    </div>
    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
      Soon
    </div>
  </div>
  <h3 className="text-sm font-semibold mb-1">Daily Post</h3>
  <p className="text-xs text-muted-foreground mb-3">
    Share on Twitter
  </p>
  <div className="mb-3 space-y-1">
    <div className="flex justify-between text-[10px]">
      <span className="text-muted-foreground">Today</span>
      <span className="text-muted-foreground font-medium">Coming Soon</span>
    </div>
    <Progress value={0} className="h-1" />
  </div>
  <Button 
    className="w-full h-8 text-xs"
    size="sm"
    variant="outline"
    disabled
  >
    <Lock className="w-3 h-3 mr-1" />
    Coming Soon
  </Button>
          </div>

          {}
          <div className="w-full md:min-w-0 snap-start snap-center group p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm hover:shadow-glow flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                Soon
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-1">Learn to Earn</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Complete lessons
            </p>
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-muted-foreground font-medium">Coming Soon</span>
              </div>
              <Progress value={0} className="h-1" />
            </div>
            <Button 
              className="w-full h-8 text-xs"
              size="sm"
              variant="outline"
              disabled
            >
              <Lock className="w-3 h-3 mr-1" />
              Coming Soon
            </Button>
          </div>
        </div>
      </div>

      {}
      <div className="flex items-center gap-2 my-6">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="w-1 h-1 rounded-full bg-primary/60" />
          <div className="w-1 h-1 rounded-full bg-primary/80" />
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-bold">One-Time Rewards</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
        
        <div className="grid gap-3 md:grid-cols-2">
          {oneTimeRewards.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-muted-foreground text-sm">
              No one-time rewards available yet. Check back soon!
            </div>
          ) : (
            oneTimeRewards.map((campaign) => (
              campaign.campaign_quests.map((quest: any) => {
                const completion = questCompletions[quest.id];
                const isCompleted = completion?.completed || false;
                const isClaimed = completion?.verified || false;
                
                return (
                  <div key={quest.id} className="group p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                        <Award className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold">{quest.title}</h3>
                          <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                            +{quest.points} ZVP
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {quest.description}
                        </p>
                        
                        {!isConnected ? (
                          <Button 
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => setShowWalletModal(true)}
                          >
                            Connect Wallet
                          </Button>
                        ) : isClaimed ? (
                          <Button 
                            disabled
                            size="sm"
                            className="w-full h-7 text-xs"
                            variant="outline"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Claimed
                          </Button>
                        ) : isCompleted ? (
                          <Button 
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => handleClaimReward(quest, campaign)}
                            disabled={loading}
                          >
                            <Gift className="w-3 h-3 mr-1" />
                            Claim Reward
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => handleQuestAction(quest, campaign)}
                            disabled={loading}
                          >
                            <FaXTwitter className="w-3 h-3 mr-1" />
                            {quest.title?.includes('Follow') ? 'Follow' : 'Start Task'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ))
          )}
          
          {}
          <div className="group p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">Invite Friends</h3>
                  <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-medium text-green-600 dark:text-green-400">
                    🔒 FHE
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Share your link (encrypted on-chain)
                </p>
                
                {}
                {pendingReferrer && !referralInfo?.hasUsedReferral && isConnected && (
                  <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Award className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-semibold">Referral Available!</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Register to earn +{referralRewards.referredReward} ZVP (encrypted)
                    </p>
                    <Button
                      onClick={handleReferralRegister}
                      disabled={loading}
                      size="sm"
                      className="w-full h-6 text-[10px]"
                    >
                      {loading ? 'Processing...' : 'Register Referral'}
                    </Button>
                  </div>
                )}

                {isConnected ? (
                  <>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}?ref=${profile?.referral_code || '...'}`}
                        className="flex-1 px-2 py-1 text-[11px] border rounded-lg bg-muted/50 backdrop-blur-sm truncate"
                      />
                      <Button onClick={copyReferralLink} variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0">
                        {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-lg font-bold text-primary">{referralInfo?.referralCount || 0}/{maxReferrals}</div>
                          {referralInfo?.decryptionPending && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {referralInfo?.decryptionPending ? 'Decrypting...' : 'Referrals'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-lg font-bold text-primary">{referralInfo?.totalEarned || 0}</div>
                          {referralInfo?.decryptionPending && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {referralInfo?.decryptionPending ? 'Decrypting...' : 'ZVP Earned'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Button onClick={() => setShowWalletModal(true)} className="w-full h-8 text-xs" size="sm">
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      {isConnected && (
        <>
          <div className="flex items-center gap-3 my-8">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
               <Shield className="w-3 h-3 text-primary" />
               <span className="text-[10px] font-medium text-primary">Privacy Layer</span>
             </div>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
           </div>

           <div className="space-y-4">
             <div className="text-center space-y-2">
               <div className="flex items-center justify-center gap-2">
                 <Key className="w-5 h-5 text-primary animate-pulse" />
                 <h2 className="text-base font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                   FHE Privacy Controls
                 </h2>
               </div>
               <p className="text-xs text-muted-foreground max-w-md mx-auto">
                 Manage your encrypted on-chain data with Fully Homomorphic Encryption
               </p>
             </div>

             <div className="p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 backdrop-blur-sm">
               <div className="mb-5 p-3 rounded-lg bg-background/50 border border-border/50">
                 <div className="flex items-start gap-3">
                   <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                     <Shield className="w-5 h-5 text-primary" />
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center justify-between mb-1.5">
                       <div className="flex items-center gap-2">
                         <h3 className="text-sm font-semibold">Encrypted Data Management</h3>
                         <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                           <span className="text-[9px] text-green-600 dark:text-green-400 font-medium">Secure</span>
                         </div>
                       </div>
                       <button
                         onClick={() => setShowFHEDetails(!showFHEDetails)}
                         className="p-1 hover:bg-primary/10 rounded-lg transition-colors"
                       >
                         <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showFHEDetails ? 'rotate-180' : ''}`} />
                       </button>
                     </div>
                     <div className={`overflow-hidden transition-all duration-300 ${showFHEDetails ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                       <p className="text-xs text-muted-foreground leading-relaxed">
                         Your rewards data is encrypted on-chain using Fully Homomorphic Encryption (FHE). 
                         Request decryption to view your latest stats securely.
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="space-y-3">
                 <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2">
                   {}
                   <div className="min-w-[85vw] md:min-w-0 snap-start snap-center group p-4 rounded-xl bg-gradient-to-br from-background to-background/50 border border-border/50 hover:border-primary/30 transition-all duration-300 flex-shrink-0">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                         <Calendar className="w-4 h-4 text-primary" />
                       </div>
                       <span className="text-xs font-semibold">Daily Login Stats</span>
                       {dailyLoginInfo?.decryptionPending && (
                         <div className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                           <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                         </div>
                       )}
                     </div>
                     <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
                       Decrypt your streak count and total claimed amount
                     </p>
                     <Button
                       onClick={handleRequestDailyDecryption}
                       disabled={loading || dailyLoginInfo?.decryptionPending}
                       size="sm"
                       variant="outline"
                       className="w-full h-8 text-[11px] group-hover:border-primary/40 transition-all"
                     >
                       <Lock className="w-3.5 h-3.5 mr-1.5" />
                       {dailyLoginInfo?.decryptionPending ? 'Decrypting...' : 'Request Decryption'}
                     </Button>
                   </div>

                   {}
                   <div className="min-w-[85vw] md:min-w-0 snap-start snap-center group p-4 rounded-xl bg-gradient-to-br from-background to-background/50 border border-border/50 hover:border-primary/30 transition-all duration-300 flex-shrink-0">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                         <Users className="w-4 h-4 text-primary" />
                       </div>
                       <span className="text-xs font-semibold">Referral Stats</span>
                       {referralInfo?.decryptionPending && (
                         <div className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                           <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                         </div>
                       )}
                     </div>
                     <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
                       Decrypt your referral count and total earnings
                     </p>
                     <Button
                       onClick={handleRequestReferralDecryption}
                       disabled={loading || referralInfo?.decryptionPending}
                       size="sm"
                       variant="outline"
                       className="w-full h-8 text-[11px] group-hover:border-primary/40 transition-all"
                     >
                       <Lock className="w-3.5 h-3.5 mr-1.5" />
                       {referralInfo?.decryptionPending ? 'Decrypting...' : 'Request Decryption'}
                     </Button>
                   </div>
                 </div>
                 
                 {}
                 <div className="flex justify-center gap-1.5 md:hidden">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                 </div>
               </div>

               <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                 <div className="flex items-start gap-2">
                   <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                   <p className="text-[10px] text-muted-foreground leading-relaxed">
                     Decryption requests are processed through the Zama network and may take a few minutes. 
                     Your data remains private and only you can decrypt it.
                   </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {}
        <SocialBindingDialog
          open={showSocialBinding}
          onOpenChange={setShowSocialBinding}
          platform={bindingPlatform}
          walletAddress={address || ''}
          onBindSuccess={() => {
            fetchRewardsData();
            setShowSocialBinding(false);
          }}
        />
      </div>
    );
  };
  
  export default Rewards;