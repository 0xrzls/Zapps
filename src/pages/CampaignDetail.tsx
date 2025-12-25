import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "@/hooks/use-toast";
import { backend } from "@/services";
import { 
  Trophy, 
  Clock, 
  Users, 
  CheckCircle2, 
  Circle, 
  Lock,
  ArrowLeft,
  Share2,
  Flag,
  Wallet,
  Zap,
  Target,
  Award,
  Coins,
  ChevronRight,
  Image,
  MessageSquare,
  Gamepad2,
  Network,
  GraduationCap,
  Twitter,
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import ClaimRewardsModal from "@/components/ClaimRewardsModal";
import { SocialBindingDialog } from "@/components/SocialBindingDialog";
import zappsLogo from "@/assets/rialo-logo.jpg";

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showHeader, setShowHeader] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [questCompletions, setQuestCompletions] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const [showSocialBinding, setShowSocialBinding] = useState(false);
  const [bindingPlatform, setBindingPlatform] = useState<"twitter" | "discord">("twitter");
  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState("");
  const { isConnected, setShowWalletModal, publicKey } = useWallet();
  
  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserProgress = async () => {
    if (!publicKey) return;
    
    const { data, error } = await backend.questCompletions.getByUser(publicKey);
    
    if (!error && data) {
      setQuestCompletions(data);
      const completed = data
        .filter(c => c.verified)
        .map(c => String(c.quest_id));
       setCompletedTasks(completed);
      
      if (data.length > 0) {
        setHasJoined(true);
      }
    }
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      const { data, error } = await backend.campaigns.getById(id!);
      
      if (!error && data) {
        setCampaign(data);
      }
    };

    const fetchQuests = async () => {
      const { data, error } = await backend.quests.getByCampaign(id!);
      
      if (!error && data) {
        
        const sorted = [...data].sort((a, b) => (a.quest_order || 0) - (b.quest_order || 0));
        setQuests(sorted);
      }
    };

    const fetchRewards = async () => {
      const { data, error } = await backend.rewards.getByCampaign(id!);
      
      if (!error && data) {
        setRewards(data);
      }
    };

    const fetchUserProfile = async () => {
      if (!publicKey) return;
      
      const { data, error } = await backend.profiles.getByWallet(publicKey);
      
      if (!error && data) {
        setUserProfile(data);
      }
    };

    if (id) {
      fetchCampaign();
      fetchQuests();
      fetchRewards();
      fetchUserProfile();
      fetchUserProgress();
    }

    if (!publicKey) return;

    const subscription = backend.realtime.subscribe(
      'quest_completions',
      '*',
      (payload) => {
        console.log('Quest completion changed:', payload);
        
        fetchUserProgress();
      },
      { column: 'user_id', value: publicKey }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [id, publicKey]);

  useEffect(() => {
    const updateCountdown = () => {
      if (campaign?.status === 'draft') {
        const now = new Date().getTime();
        const startTime = new Date(campaign.start_date).getTime();
        const diff = startTime - now;
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (days > 0) {
            setCountdown(`Opens in ${days}d ${hours}h ${minutes}m`);
          } else {
            setCountdown(`Opens in ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
        } else {
          setCountdown("Opening now...");
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    };

    if (campaign?.status === 'draft') {
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [campaign]);
  
  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-2">Campaign Not Found</h1>
          <p className="text-sm text-muted-foreground">The campaign you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const totalPoints = quests.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = quests
    .filter(q => completedTasks.includes(String(q.id)))
    .reduce((sum, q) => sum + q.points, 0);
  
  const progress = quests.length > 0 ? (completedTasks.length / quests.length) * 100 : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DeFi":
        return <Coins className="w-3 h-3" />;
      case "NFT":
        return <Image className="w-3 h-3" />;
      case "Social":
        return <MessageSquare className="w-3 h-3" />;
      case "Gaming":
        return <Gamepad2 className="w-3 h-3" />;
      case "Infrastructure":
        return <Network className="w-3 h-3" />;
      default:
        return <GraduationCap className="w-3 h-3" />;
    }
  };

  const getRewardIcon = (type: string) => {
    switch(type) {
      case "POINT": return "💰";
      case "NFT": return "🎨";
      case "ROLE": return "👑";
      default: return "🎁";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "draft":
        return "bg-blue-100/80 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case "completed":
        return "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
      case "paused":
        return "bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      default:
        return "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "draft": return "Upcoming";
      case "completed": return "Completed";
      case "paused": return "Paused";
      default: return status;
    }
  };

  const handleConnectSocial = (quest: any, platform: "twitter" | "discord") => {
    setPendingQuestId(quest.id);
    setBindingPlatform(platform);
    setShowSocialBinding(true);
  };

  const handleFollowClick = async (quest: any) => {
    
    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    const needsTwitter = ['twitter_follow', 'twitter_retweet', 'twitter_tweet'].includes(quest.quest_type);
    const needsDiscord = ['discord_join', 'discord_role'].includes(quest.quest_type);

    if (needsTwitter && !userProfile?.twitter_connected) {
      toast({
        title: "Twitter Connection Required",
        description: "Please connect your Twitter account first to complete this quest.",
        variant: "destructive",
      });
      handleConnectSocial(quest, "twitter");
      return;
    }

    if (needsDiscord && !userProfile?.discord_connected) {
      toast({
        title: "Discord Connection Required",
        description: "Please connect your Discord account first to complete this quest.",
        variant: "destructive",
      });
      handleConnectSocial(quest, "discord");
      return;
    }

    if (!hasJoined) return;

    try {
      
      try {
        if (quest.quest_type === 'twitter_follow') {
          const raw = quest.verification_config?.target_username ?? quest.verification_config?.twitter_username;
          const targetUsername = typeof raw === 'string' ? raw.replace(/^@/, '') : undefined;
          const url = targetUsername
            ? `https://twitter.com/${targetUsername}`
            : (quest.link || undefined);
          if (url) window.open(url, '_blank');
        } else if (quest.quest_type === 'twitter_retweet') {
          const tweetUrl = quest.verification_config?.tweet_url || quest.link;
          if (tweetUrl) {
            window.open(tweetUrl, '_blank');
          } else {
            throw new Error('Tweet URL not configured');
          }
        } else if (quest.quest_type === 'twitter_tweet') {
          if (quest.link) {
            window.open(quest.link, '_blank');
          } else if (Array.isArray(quest.verification_config?.hashtags) && quest.verification_config.hashtags.length > 0) {
            const hashtags = quest.verification_config.hashtags
              .map((h: string) => h.replace(/^#/, ''))
              .filter(Boolean)
              .join(',');
            const intent = `https://twitter.com/intent/tweet?hashtags=${encodeURIComponent(hashtags)}`;
            window.open(intent, '_blank');
          } else {
            window.open('https://twitter.com/compose/tweet', '_blank');
          }
        } else if (quest.link) {
          window.open(quest.link, '_blank');
        }
      } catch (e) {
        console.error('Open link error:', e);
        toast({
          title: 'Link tidak ditemukan',
          description: 'Konfigurasi link untuk task ini belum diisi di admin.',
          variant: 'destructive',
        });
        return;
      }

      const { data: existing } = await backend.questCompletions.getByUserAndQuest(publicKey, quest.id);

      if (existing) {
        await backend.questCompletions.update(existing.id, {
          completed: true,
          completed_at: new Date().toISOString(),
          verified: false,
        });
      } else {
        await backend.questCompletions.create({
          user_id: publicKey,
          quest_id: quest.id,
          completed: true,
          completed_at: new Date().toISOString(),
          verified: false,
          verification_data: {
            method: quest.verification_method,
            quest_type: quest.quest_type,
          }
        });
      }

      const { data } = await backend.questCompletions.getByUser(publicKey);
      
      if (data) {
        setQuestCompletions(data);
      }

      const actionLabel = quest.quest_type === 'twitter_follow'
        ? 'Follow link dibuka'
        : quest.quest_type === 'twitter_retweet'
        ? 'Retweet dibuka'
        : quest.quest_type === 'twitter_tweet'
        ? 'Tweet composer dibuka'
        : 'Link dibuka';

      toast({
        title: actionLabel,
        description: 'Klik Verify setelah selesai.',
      });
    } catch (error) {
      console.error('Error marking follow:', error);
      toast({
        title: "Error",
        description: "Failed to process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyClick = async (quest: any) => {
    
    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    setIsVerifying(prev => ({ ...prev, [quest.id]: true }));

    try {
      
      if (quest.quest_type === 'twitter_follow') {
        const manualKey = `tw_follow_manual:${publicKey}:${quest.id}`;
        const firstAttemptDone = localStorage.getItem(manualKey) === '1';

        if (!firstAttemptDone) {
          
          localStorage.setItem(manualKey, '1');

          await backend.questCompletions.updateByUserAndQuest(publicKey, quest.id, { completed: false });

          const { data: updated } = await backend.questCompletions.getByUser(publicKey);

          if (updated) {
            setQuestCompletions(updated);
          }

          toast({
            title: 'Belum terdeteksi',
            description: 'Klik Follow lagi lalu Verify (ke-2) untuk melanjutkan.',
            variant: 'destructive',
          });
          return;
        } else {
          
          const { data: existing } = await backend.questCompletions.getByUserAndQuest(publicKey, quest.id);

           if (existing) {
             const prevData = (existing.verification_data && typeof existing.verification_data === 'object' && !Array.isArray(existing.verification_data))
               ? (existing.verification_data as Record<string, any>)
               : {};
             await backend.questCompletions.update(existing.id, {
               completed: true,
               completed_at: existing.completed_at || new Date().toISOString(),
               verified: true,
               verified_at: new Date().toISOString(),
               verification_data: {
                 ...prevData,
                 manual_double_verify: true,
               },
             });
           } else {
            await backend.questCompletions.create({
              user_id: publicKey,
              quest_id: quest.id,
              completed: true,
              completed_at: new Date().toISOString(),
              verified: true,
              verified_at: new Date().toISOString(),
              verification_data: {
                method: quest.verification_method,
                quest_type: quest.quest_type,
                manual_double_verify: true,
              },
            });
          }

          const { data: completionsData } = await backend.questCompletions.getByUser(publicKey);

          if (completionsData) {
            setQuestCompletions(completionsData);
             const completed = completionsData
               .filter((c) => c.verified)
               .map((c) => String(c.quest_id));
             setCompletedTasks(completed);
          }

          localStorage.removeItem(manualKey);

          toast({
            title: 'Quest Completed!',
            description: `You earned ${quest.points} points!`,
          });
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      const raw = quest.verification_config?.target_username ?? quest.verification_config?.twitter_username;
      let normalizedConfig: any = quest.verification_config;

      if (quest.quest_type === 'twitter_follow') {
        normalizedConfig = { target_username: typeof raw === 'string' ? raw.replace(/^@/, '') : raw };
      } else if (quest.quest_type === 'twitter_retweet') {
        const rawUrl: string | undefined = quest.verification_config?.tweet_url || quest.link;
        const extractTweetId = (url?: string): string | undefined => {
          if (!url) return undefined;
          try {
            
            const u = new URL(url.replace('://x.com', '://twitter.com'));
            const match = u.pathname.match(/status\/(\d+)/);
            return match?.[1];
          } catch {
            const m = url.match(/status\/(\d+)/);
            return m?.[1];
          }
        };
        const tweetId = extractTweetId(rawUrl);
        normalizedConfig = { tweet_id: tweetId };
      }

      const delays = [0, 5000, 12000];
      let isVerified = false;
      let lastError: any = null;

      for (let i = 0; i < delays.length; i++) {
        if (delays[i] > 0) {
          await new Promise((r) => setTimeout(r, delays[i]));
        }
        const { data, error } = await backend.functions.invoke('verify-twitter-quest', {
          questId: quest.id,
          walletAddress: publicKey,
          questType: quest.quest_type,
          verificationConfig: normalizedConfig,
        });
        if (error) {
          lastError = error;
        }
        if (data?.verified) {
          isVerified = true;
          break;
        }
      }

      if (lastError) console.warn('Verify attempts error:', lastError);

      if (isVerified) {
        
        const { data: completionsData } = await backend.questCompletions.getByUser(publicKey);
        
        if (completionsData) {
          setQuestCompletions(completionsData);
           const completed = completionsData
             .filter(c => c.verified)
             .map(c => String(c.quest_id));
           setCompletedTasks(completed);
        }

        toast({
          title: "Quest Completed!",
          description: `You earned ${quest.points} points!`,
        });
      } else {
        
        await backend.questCompletions.updateByUserAndQuest(publicKey, quest.id, { completed: false });

        const { data: updated } = await backend.questCompletions.getByUser(publicKey);

        if (updated) {
          setQuestCompletions(updated);
        }

        const verb = quest.quest_type === 'twitter_retweet' ? 'Retweet' 
          : quest.quest_type === 'twitter_tweet' ? 'Tweet' 
          : 'Follow';
        toast({
          title: "Belum terverifikasi",
          description: `Klik ${verb} lagi lalu Verify setelah selesai.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying quest:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(prev => ({ ...prev, [quest.id]: false }));
    }
  };

  const handleTaskClick = async (quest: any) => {
    
    const isTwitterQuest = ['twitter_follow', 'twitter_tweet', 'twitter_retweet'].includes(quest.quest_type);
    
    if (isTwitterQuest) {
      
      return;
    }

    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    if (completedTasks.includes(String(quest.id))) return;

    if (!hasJoined) return;

    setIsVerifying(prev => ({ ...prev, [quest.id]: true }));

    try {
      
      if (quest.link) {
        window.open(quest.link, '_blank');
      }

      const { data: existingCompletion } = await backend.questCompletions.getByUserAndQuest(publicKey, quest.id);

      if (!existingCompletion) {
        
        const { error: insertError } = await backend.questCompletions.create({
          user_id: publicKey,
          quest_id: quest.id,
          completed: true,
          completed_at: new Date().toISOString(),
          verified: quest.auto_verify || false,
          verified_at: quest.auto_verify ? new Date().toISOString() : null,
          verification_data: {
            method: quest.verification_method,
            quest_type: quest.quest_type,
          }
        });

        if (insertError) throw insertError;

        if (quest.auto_verify) {
          setCompletedTasks([...completedTasks, String(quest.id)]);
          toast({
            title: "Quest Completed!",
            description: `You earned ${quest.points} points!`,
          });
        } else {
          toast({
            title: "Quest Submitted!",
            description: "Your quest is pending verification.",
          });
        }
      } else {
        toast({
          title: "Already Submitted",
          description: "You've already submitted this quest.",
        });
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      toast({
        title: "Error",
        description: "Failed to complete quest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(prev => ({ ...prev, [quest.id]: false }));
    }
  };

  const handleJoinQuest = async () => {
    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to join.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    const { error } = await backend.campaigns.update(id!, { 
      participants_count: (campaign.participants_count || 0) + 1 
    });

    if (!error) {
      setHasJoined(true);
      setCampaign({
        ...campaign,
        participants_count: (campaign.participants_count || 0) + 1
      });
      toast({
        title: "Quest Joined!",
        description: "Complete all tasks to claim your rewards.",
      });
    }
  };

  const handleOpenClaimModal = () => {
    if (!isConnected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to claim rewards.",
        variant: "destructive",
      });
      setShowWalletModal?.(true);
      return;
    }

    const allVerified = quests.every(quest => 
      questCompletions.some(c => c.quest_id === quest.id && c.verified)
    );

    if (!allVerified) {
      toast({
        title: "Not Ready",
        description: "Complete and verify all quests first.",
        variant: "destructive",
      });
      return;
    }

    setShowClaimModal(true);
  };

  const handleClaimComplete = async () => {
    if (!publicKey) return;

    try {
      
      const claimPromises = rewards.map(reward => 
        backend.userRewardClaims.create({
          user_id: publicKey,
          campaign_id: id!,
          reward_id: reward.id,
          claimed: true,
          claimed_at: new Date().toISOString(),
          claim_data: {
            reward_type: reward.reward_type,
            reward_name: reward.reward_name,
          }
        })
      );

      await Promise.all(claimPromises);

      setHasClaimed(true);
      toast({
        title: "Rewards Claimed!",
        description: "All rewards have been added to your account.",
      });
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast({
        title: "Error",
        description: "Failed to claim rewards. Please try again.",
        variant: "destructive",
      });
    }
  };

  const timeLeft = () => {
    const now = new Date();
    const endDate = new Date(campaign?.end_date);
    const diff = endDate.getTime() - now.getTime();
    if (diff < 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const isUpcoming = campaign?.status === 'draft';
  const canJoin = !isUpcoming && !hasJoined;

  return (
    <div className="min-h-screen bg-background pb-20">
      {}
      <div className={`fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300 ${
        showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link to="/campaigns">
            <Button variant="ghost" size="sm" className="gap-1 px-2 h-8">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">Back</span>
            </Button>
          </Link>
          <div className="flex-1 text-center px-3">
            <h2 className="text-xs font-semibold truncate">{campaign.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Share2 
              className={`w-4 h-4 cursor-pointer transition-colors ${isShared ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setIsShared(!isShared)}
            />
            <Flag 
              className={`w-4 h-4 cursor-pointer transition-colors ${isFlagged ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setIsFlagged(!isFlagged)}
            />
          </div>
        </div>
      </div>

      {}
      <div className="relative overflow-hidden">
        {}
        <div className={`relative h-48 md:h-64 overflow-hidden ${
          campaign.status === "ended" ? "opacity-60" : ""
        }`}>
          <img 
            src={campaign.cover_image || zappsLogo} 
            alt={campaign.title}
            className="w-full h-full object-cover"
            style={{ 
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)', 
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)' 
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background)/0.95)_15%,hsl(var(--background)/0.7)_30%,hsl(var(--background)/0.3)_50%,transparent_70%)]" />

          {}
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
              {getCategoryIcon(campaign.category)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
              {getStatusLabel(campaign.status)}
            </span>
          </div>
        </div>

        {}
        <div className="container mx-auto px-4">
          {}
          <div className="flex items-start gap-3 -mt-16 md:-mt-20 relative z-10 mb-4">
            {}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background bg-card overflow-hidden flex-shrink-0">
              <img 
                src={campaign.logo || zappsLogo} 
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {}
            <div className="flex-1 min-w-0 pt-8">
              <h1 className="text-lg md:text-xl font-bold leading-tight mb-1">{campaign.title}</h1>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {campaign.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="container mx-auto px-4 pb-6 space-y-3">
        
        {}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center py-2.5 border border-border/50 rounded-lg bg-card/50">
            <Clock className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <div className="text-xs font-semibold">{timeLeft()}</div>
            <div className="text-[9px] text-muted-foreground">Left</div>
          </div>
          <div className="text-center py-2.5 border border-border/50 rounded-lg bg-card/50">
            <Users className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <div className="text-xs font-semibold">{campaign.participants_count || 0}</div>
            <div className="text-[9px] text-muted-foreground">Joined</div>
          </div>
          <div className="text-center py-2.5 border border-border/50 rounded-lg bg-card/50">
            <Trophy className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
            <div className="text-xs font-semibold">{campaign.reward_amount || 0}</div>
            <div className="text-[9px] text-muted-foreground">{campaign.reward_token || 'Points'}</div>
          </div>
        </div>

        <Separator />

        {}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-xs font-semibold">Your Progress</h2>
            </div>
            <div className="text-[10px] font-medium text-primary">{Math.round(progress)}%</div>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>{earnedPoints} / {totalPoints} Points</span>
            <span>{completedTasks.length} / {quests.length} Tasks</span>
          </div>
        </div>

        <Separator />

        {}
        {hasJoined && !hasClaimed && quests.length > 0 && (() => {
          
          const currentTaskIndex = quests.findIndex(q => !completedTasks.includes(String(q.id)));
          const currentTask = currentTaskIndex !== -1 ? quests[currentTaskIndex] : null;
          
          const allComplete = currentTaskIndex === -1;
          
          if (allComplete) {
            return (
              <>
                <div className="space-y-3 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-bold">All Tasks Completed!</h2>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground">Total Points Earned</span>
                      <span className="text-sm font-bold text-primary">{totalPoints} Points</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-muted-foreground">Tasks Completed</span>
                      <span className="text-sm font-bold">{quests.length}/{quests.length}</span>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            );
          }
          
          if (!currentTask) return null;
          
          const isVerifyingQuest = isVerifying[currentTask.id];
          const questCompletion = questCompletions.find(c => c.quest_id === currentTask.id);
          const hasClickedFollow = questCompletion?.completed && !questCompletion?.verified;
          
          const needsTwitter = ['twitter_follow', 'twitter_tweet', 'twitter_retweet'].includes(currentTask.quest_type);
          const needsDiscord = ['discord_join', 'discord_role'].includes(currentTask.quest_type);
          const isTwitterConnected = !!userProfile?.twitter_username;
          const isDiscordConnected = !!userProfile?.discord_username;
          
          const targetUsername = (currentTask.verification_config?.target_username ?? currentTask.verification_config?.twitter_username)?.replace(/^@/, '');
          
          return (
            <>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <h2 className="text-xs font-semibold">Current Task</h2>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Task {currentTaskIndex + 1} of {quests.length}
                  </div>
                </div>
                
                <div className="space-y-3 border border-primary/40 rounded-xl p-4 bg-card">
                  {}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-background border-primary text-primary">
                      <span>{currentTaskIndex + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold flex-1">{currentTask.title}</h3>
                        {currentTask.guide && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => setExpandedGuides(prev => ({
                              ...prev,
                              [currentTask.id]: !prev[currentTask.id]
                            }))}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedGuides[currentTask.id] ? 'rotate-180' : ''}`} />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentTask.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-primary">
                        <Coins className="w-3 h-3" />
                        <span>+{currentTask.points} Points</span>
                      </div>
                    </div>
                  </div>

                  {}
                  {currentTask.guide && expandedGuides[currentTask.id] && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 animate-accordion-down">
                      <div className="text-xs text-muted-foreground whitespace-pre-line">
                        {currentTask.guide}
                      </div>
                    </div>
                  )}

                  {}
                  <div className="space-y-2 animate-fade-in">
                    {needsTwitter && !hasClickedFollow ? (
                      <Button 
                        className="w-full transition-all"
                        style={{ 
                          background: `hsl(var(--primary) / ${0.3 + (progress / 100) * 0.7})`,
                          color: 'hsl(var(--primary-foreground))'
                        }}
                        onClick={() => handleFollowClick(currentTask)}
                        disabled={isVerifyingQuest}
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        {currentTask.quest_type === 'twitter_follow' && targetUsername 
                          ? `Follow @${targetUsername}`
                          : currentTask.quest_type === 'twitter_tweet'
                          ? 'Tweet'
                          : currentTask.quest_type === 'twitter_retweet'
                          ? 'Retweet'
                          : 'Follow'}
                      </Button>
                    ) : needsTwitter && hasClickedFollow ? (
                      <Button 
                        className="w-full transition-all"
                        style={{ 
                          background: `hsl(var(--primary) / ${0.3 + (progress / 100) * 0.7})`,
                          color: 'hsl(var(--primary-foreground))'
                        }}
                        onClick={() => handleVerifyClick(currentTask)}
                        disabled={isVerifyingQuest}
                      >
                        {isVerifyingQuest ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Verify
                          </>
                        )}
                      </Button>
                    ) : needsTwitter && !isTwitterConnected ? (
                      <Button 
                        className="w-full transition-all"
                        style={{ 
                          background: `hsl(var(--primary) / ${0.3 + (progress / 100) * 0.7})`,
                          color: 'hsl(var(--primary-foreground))'
                        }}
                        onClick={() => handleConnectSocial(currentTask, "twitter")}
                        disabled={isVerifyingQuest}
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Connect Twitter (optional)
                      </Button>
                    ) : needsDiscord && !isDiscordConnected ? (
                      <Button 
                        className="w-full transition-all"
                        style={{ 
                          background: `hsl(var(--primary) / ${0.3 + (progress / 100) * 0.7})`,
                          color: 'hsl(var(--primary-foreground))'
                        }}
                        onClick={() => handleConnectSocial(currentTask, "discord")}
                        disabled={isVerifyingQuest}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Connect Discord (optional)
                      </Button>
                    ) : (
                      <Button 
                        className="w-full transition-all"
                        style={{ 
                          background: `hsl(var(--primary) / ${0.3 + (progress / 100) * 0.7})`,
                          color: 'hsl(var(--primary-foreground))'
                        }}
                        onClick={() => handleTaskClick(currentTask)}
                        disabled={isVerifyingQuest}
                      >
                        {isVerifyingQuest ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            {needsDiscord ? 'Open Discord' : 'Start Task'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          );
        })()}

        {}
        {hasClaimed && (
          <>
            <div className="space-y-3 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold">Quest Completed!</h2>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Total Points Earned</span>
                  <span className="text-sm font-bold text-primary">{totalPoints} Points</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Tasks Completed</span>
                  <span className="text-sm font-bold">{quests.length}/{quests.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">Rewards Claimed</span>
                  <span className="text-sm font-bold">{rewards.length} Rewards</span>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {}
        {!hasClaimed && (
          <>
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-primary" />
                <h2 className="text-xs font-semibold">Rewards</h2>
              </div>
              
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {rewards.map((reward) => (
                  <div key={reward.id} className="flex-shrink-0 w-24 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-2.5 text-center">
                    <div className="text-xl mb-0.5">{getRewardIcon(reward.reward_type)}</div>
                    <div className="text-[10px] font-semibold mb-0.5">{reward.reward_name}</div>
                    <div className="text-[9px] text-muted-foreground line-clamp-1">
                      {reward.reward_config?.value || 'Reward'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-muted-foreground">Hosted by</div>
          <div className="flex items-center gap-2">
            {(campaign.hosted_by || [zappsLogo]).map((logo: string, index: number) => (
              <div key={index} className="w-8 h-8 rounded-lg overflow-hidden border border-border/50 bg-card">
                <img src={logo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      {!hasJoined || hasClaimed || progress === 100 ? (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-40 md:pb-4 pb-20 animate-fade-in">
          {!isConnected ? (
            <Button 
              className="w-full h-11 gradient-primary text-sm font-semibold glow-effect"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : isUpcoming ? (
            <Button 
              className="w-full h-11 bg-muted text-sm font-semibold"
              disabled
            >
              <Clock className="w-4 h-4 mr-2" />
              {countdown || "Coming Soon"}
            </Button>
          ) : !hasJoined ? (
            <Button 
              className="w-full h-11 gradient-primary text-sm font-semibold glow-effect"
              onClick={handleJoinQuest}
            >
              <Zap className="w-4 h-4 mr-2" />
              Join Quest
            </Button>
          ) : progress === 100 && !hasClaimed ? (
            <Button 
              className="w-full h-11 gradient-primary text-sm font-semibold glow-effect animate-pulse"
              onClick={handleOpenClaimModal}
            >
              <Award className="w-4 h-4 mr-2" />
              Claim Reward
            </Button>
          ) : (
            <Button 
              className="w-full h-11 bg-muted text-sm font-semibold"
              disabled
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Quest Completed
            </Button>
          )}
        </div>
      ) : null}

      {}
      <SocialBindingDialog
        open={showSocialBinding}
        onOpenChange={setShowSocialBinding}
        platform={bindingPlatform}
        walletAddress={publicKey || ""}
        onBindSuccess={() => {
          
          const refetch = async () => {
            if (!publicKey) return;
            
            const { data } = await backend.profiles.getByWallet(publicKey);
            
            if (data) {
              setUserProfile(data);
              
              if (pendingQuestId) {
                const quest = quests.find(q => q.id === pendingQuestId);
                if (quest) {
                  setTimeout(() => handleTaskClick(quest), 500);
                }
                setPendingQuestId(null);
              }
            }
          };
          refetch();
        }}
      />

      {}
      <ClaimRewardsModal 
        open={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        rewards={rewards.map(r => ({
          type: r.reward_type,
          value: r.reward_config?.value || r.reward_name
        }))}
        totalPoints={totalPoints}
        onClaim={handleClaimComplete}
      />
    </div>
  );
};

export default CampaignDetail;
