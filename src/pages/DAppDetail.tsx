import { useParams, Link as RouterLink } from "react-router-dom";
import { Star, Users, Globe, MessageCircle, Github, ExternalLink, Vote, Share2, Flag, Heart, Shield, ThumbsUp, Monitor, Smartphone, BarChart3, TrendingUp, Wallet, Send, Paperclip, Link, Filter, MousePointer, DollarSign, Activity, Calendar, CheckCircle, BookOpen, Zap, VenetianMask, RefreshCw, Clock } from "lucide-react";
import { generateDAppSlug, getDisplayRating, formatRating } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { FaXTwitter } from "react-icons/fa6";
import { FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import UpdatesSection from "@/components/UpdatesSection";
import { Separator } from "@/components/ui/separator";
import { VoteModal } from "@/components/VoteModal";
import { ShareDialog } from "@/components/ShareDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { DiscussionThread } from "@/components/DiscussionThread";
import { StarRating } from "@/components/StarRating";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { backend } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useTranslation } from "react-i18next";
import uniswapLogo from "@/assets/uniswap-logo.png";
import aaveLogo from "@/assets/aave-logo.png";
import openseaLogo from "@/assets/opensea-logo.png";
import axieLogo from "@/assets/axie-logo.png";
import compoundLogo from "@/assets/compound-logo.png";
import lensLogo from "@/assets/lens-logo.png";
import pancakeswapLogo from "@/assets/pancakeswap-logo.png";
import sandboxLogo from "@/assets/sandbox-logo.png";

import screenshotHomeDesktop from "@/assets/screenshot-home-desktop.jpg";
import screenshotDappsDesktop from "@/assets/screenshot-dapps-desktop.jpg";
import screenshotCampaignsDesktop from "@/assets/screenshot-campaigns-desktop.jpg";
import screenshotLearnDesktop from "@/assets/screenshot-learn-desktop.jpg";
import screenshotDetailDesktop from "@/assets/screenshot-detail-desktop.jpg";

import screenshotHomeMobile from "@/assets/screenshot-home-mobile.jpg";
import screenshotDappsMobile from "@/assets/screenshot-dapps-mobile.jpg";
import screenshotCampaignsMobile from "@/assets/screenshot-campaigns-mobile.jpg";
import screenshotLearnMobile from "@/assets/screenshot-learn-mobile.jpg";
import screenshotDetailMobile from "@/assets/screenshot-detail-mobile.jpg";

const DAppDetail = () => {
  const { id: slug } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected, network } = useWallet();
  const { t } = useTranslation();
  const [dapp, setDapp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [analyticsFilter, setAnalyticsFilter] = useState("1D");
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [analyticsData, setAnalyticsData] = useState({
    totalInteractions: 0,
    totalUsers: 0,
    totalValueLocked: 0,
    dailyChart: []
  });
  const [chatMessage, setChatMessage] = useState("");
  const [attachIconActive, setAttachIconActive] = useState(false);
  const [relatedDApps, setRelatedDApps] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [relatedVoteCounts, setRelatedVoteCounts] = useState<Record<string, number>>({});
  const [relatedRatingAverages, setRelatedRatingAverages] = useState<Record<string, number>>({});
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitializingFHE, setIsInitializingFHE] = useState(false);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(false);
  const [scores, setScores] = useState({
    social_score: 0,
    trust_score: 'N/A' as 'N/A' | 'LOW' | 'MED' | 'HIGH',
    user_score: 0,
    vote_score: 0
  });
  
  const [fheAverage, setFheAverage] = useState<number | null>(null);
  const [fheCount, setFheCount] = useState<number | null>(null);
  const [fheUniqueVoters, setFheUniqueVoters] = useState<number | null>(null);
  const [fheLastUpdate, setFheLastUpdate] = useState<number | null>(null);
  const [isRefreshingFHE, setIsRefreshingFHE] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) return;
      
      const { data } = await backend.auth.hasRole(user.id, 'admin');
      setIsAdmin(data || false);
    };
    
    checkAdmin();
  }, [user?.id]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!dapp?.id) return;
      
      const { data, error } = await backend.scores.getByDApp(dapp.id);

      if (!error && data) {
        setScores({
          social_score: data.social_score || 0,
          trust_score: 'N/A',
          user_score: data.user_score || 0,
          vote_score: data.vote_score || 0
        });
      }
    };

    fetchScores();
  }, [dapp?.id]);

  useEffect(() => {
    let rating = 0;
    
    if (fheAverage !== null && Number(fheAverage) > 0) {
      rating = Number(fheAverage);
    }
    
    else if (scores.vote_score && Number(scores.vote_score) > 0) {
      const vs = Number(scores.vote_score);
      rating = vs > 5 ? vs / 2 : vs;
    }
    
    else if (dapp?.rating !== undefined && dapp?.rating !== null && Number(dapp.rating) > 0) {
      rating = Number(dapp.rating);
    }
    
    if (!rating || Number.isNaN(rating) || rating <= 0) {
      setScores(prev => ({ ...prev, trust_score: 'N/A' }));
    } else if (rating >= 4) {
      setScores(prev => ({ ...prev, trust_score: 'HIGH' }));
    } else if (rating >= 3) {
      setScores(prev => ({ ...prev, trust_score: 'MED' }));
    } else {
      setScores(prev => ({ ...prev, trust_score: 'LOW' }));
    }
  }, [fheAverage, scores.vote_score, dapp?.rating]);

  const fetchFHEData = async (forceRefresh = false) => {
    if (!dapp?.id || network !== 'sepolia') return;

    const cacheKey = `fhe_rating_${dapp.id}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          
          if (cacheAge < 2 * 60 * 1000) {
            setFheAverage(cachedData.average);
            setFheCount(cachedData.voteCount);
            setFheUniqueVoters(cachedData.uniqueVoters);
            setFheLastUpdate(cachedData.lastUpdate || null);
            return;
          }
        } catch (e) {
          console.error('Failed to parse cached FHE data:', e);
        }
      }
    }

    try {
      const adapter = (window as any).__walletAdapter;
      if (!adapter) return;
      
      const { ZappsVoting } = await import('@/lib/contracts/zappsContracts');
      const { EVMWalletAdapter } = await import('@/lib/wallet/adapters/EVMWalletAdapter');
      
      if (adapter instanceof EVMWalletAdapter) {
        const voting = new ZappsVoting(adapter);
        await voting.initialize();
        
        const targetData = await voting.getTargetData(dapp.id);
        let average = Number(targetData.average) / 100; 
        const totalVotes = Number(targetData.totalVotes);
        const uniqueVoters = Number(targetData.uniqueVoters);
        const lastUpdate = Number(targetData.lastUpdate);
        
        console.log('[DAppDetail] FHE target data:', {
          average,
          totalVotes,
          decryptedCount: targetData.count,
          uniqueVoters,
          lastUpdate
        });

        setFheCount(totalVotes);
        setFheUniqueVoters(uniqueVoters);
        setFheLastUpdate(lastUpdate);
        
        if (average > 0) {
          setFheAverage(average);
          localStorage.setItem(cacheKey, JSON.stringify({
            average,
            voteCount: totalVotes,
            uniqueVoters,
            lastUpdate,
            timestamp: Date.now()
          }));
        } else {
          
          console.log('[DAppDetail] On-chain average is 0, trying publicDecrypt from frontend...');
          
          try {
            const decrypted = await voting.publicDecryptRating(dapp.id);
            
            if (decrypted && decrypted.count > 0) {
              console.log('[DAppDetail] publicDecrypt SUCCESS:', decrypted);
              setFheAverage(decrypted.average);
              localStorage.setItem(cacheKey, JSON.stringify({
                average: decrypted.average,
                voteCount: totalVotes,
                uniqueVoters,
                lastUpdate,
                timestamp: Date.now()
              }));
            } else {
              
              console.log('[DAppDetail] publicDecrypt returned no data, trying database...');
              const { data: scoreData } = await backend.scores.getByDApp(dapp.id);
              if (scoreData?.vote_score && scoreData.vote_score > 0) {
                const dbAverage = Number(scoreData.vote_score);
                setFheAverage(dbAverage);
                console.log('[DAppDetail] Using vote_score from database:', dbAverage);
              }
            }
          } catch (decryptError) {
            console.warn('[DAppDetail] publicDecrypt failed:', decryptError);
            
            try {
              const { data: scoreData } = await backend.scores.getByDApp(dapp.id);
              if (scoreData?.vote_score && scoreData.vote_score > 0) {
                setFheAverage(Number(scoreData.vote_score));
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch FHE rating from ZappsVoting:', error);
    }
  };

  const handleRefreshFHE = async () => {
    if (isRefreshingFHE || !dapp?.id) return;
    
    setIsRefreshingFHE(true);
    try {
      
      localStorage.removeItem(`fhe_rating_${dapp.id}`);
      
      toast({
        title: "Refreshing Data",
        description: "Reading FHE voting data from blockchain...",
      });
      
      await fetchFHEData(true);
      
      toast({
        title: "Scores Refreshed",
        description: "Data updated from blockchain",
      });
    } catch (error) {
      console.error('Failed to refresh FHE:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not read scores from blockchain. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingFHE(false);
    }
  };

  useEffect(() => {
    fetchFHEData();
  }, [dapp?.id, network]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!dapp?.id) return;
      
      const { data, error } = await backend.pageViews.getByDApp(dapp.id);

      if (!error && data) {
        setAnalyticsData({
          totalInteractions: data.length,
          totalUsers: new Set(data.map(v => v.user_id).filter(Boolean)).size,
          totalValueLocked: dapp?.tvl || 0,
          dailyChart: []
        });
      }
    };

    if (dapp?.id) {
      fetchAnalytics();
    }
  }, [dapp?.id]);

  useEffect(() => {
    const fetchDiscussions = async () => {
      if (!dapp?.id) return;
      
      setIsLoadingDiscussions(true);
      const { data: discussionsData, error: discussionsError } = await backend.discussions.getByDApp(dapp.id);

      if (discussionsError) {
        console.error('Error fetching discussions:', discussionsError);
        setIsLoadingDiscussions(false);
        return;
      }

      if (discussionsData && discussionsData.length > 0) {
        const discussionsWithProfiles = discussionsData.map(discussion => ({
          ...discussion,
          profiles: { 
            wallet_address: discussion.user_id 
              ? `${discussion.user_id.slice(0, 6)}...${discussion.user_id.slice(-4)}`
              : 'Unknown'
          }
        }));

        setDiscussions(discussionsWithProfiles);
      } else {
        setDiscussions([]);
      }
      setIsLoadingDiscussions(false);
    };

    fetchDiscussions();

    if (dapp?.id) {
      const subscription = backend.realtime.subscribe(
        'dapp_discussions',
        'INSERT',
        () => {
          fetchDiscussions();
        },
        { column: 'dapp_id', value: dapp.id }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [dapp?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const carouselContainer = document.querySelector('[data-carousel="preview"]');
      if (carouselContainer) {
        const scrollContainer = carouselContainer.querySelector('.embla__container');
        if (scrollContainer) {
          const scrollWidth = scrollContainer.scrollWidth;
          const clientWidth = scrollContainer.clientWidth;
          const currentScroll = scrollContainer.scrollLeft;
          
          if (currentScroll >= scrollWidth - clientWidth) {
            scrollContainer.scrollLeft = 0;
          } else {
            scrollContainer.scrollLeft += clientWidth;
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDApp = async () => {
      if (!slug) return;
      
      setLoading(true);
      
      const { data: dappData, error } = await backend.dapps.getBySlug(slug);

      if (error) {
        console.error('Error fetching dApp:', error);
        toast({
          title: "Error",
          description: "Failed to load dApp details",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setDapp(dappData);
      setLoading(false);
    };

    fetchDApp();
  }, [slug, toast]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!dapp) return;
      setIsLoadingRelated(true);

      const { data: allDapps } = await backend.dapps.getAll();
      const related = allDapps || [];

      let filtered = related
        .filter((r: any) => r.category === dapp.category && r.id !== dapp.id)
        .slice(0, 6);

      if (filtered.length < 6) {
        const others = related
          .filter((r: any) => r.id !== dapp.id && r.category !== dapp.category)
          .slice(0, 6 - filtered.length);
        filtered = [...filtered, ...others];
      }

      setRelatedDApps(filtered);

      const ids = filtered.map((x: any) => x.id);
      if (ids.length > 0) {
        
        const votesPromises = ids.map(id => backend.votes.getByDApp(id));
        const votesResults = await Promise.all(votesPromises);

        const counts: Record<string, number> = {};
        const sums: Record<string, number> = {};
        const numRatings: Record<string, number> = {};
        
        votesResults.forEach((result, idx) => {
          const voteRows = result.data || [];
          const dappId = ids[idx];
          voteRows.forEach((v: any) => {
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
        
        setRelatedVoteCounts(counts);
        const avg: Record<string, number> = {};
        Object.keys(sums).forEach((id) => {
          const c = numRatings[id] || 0;
          avg[id] = c > 0 ? sums[id] / c : 0;
        });
        setRelatedRatingAverages(avg);
      }

      setIsLoadingRelated(false);
    };

    fetchRelated();
  }, [dapp]);

  useEffect(() => {
    const fetchVotes = async () => {
      if (!dapp?.id) return;

      const { data, error } = await backend.votes.getByDApp(dapp.id);

      if (!error && data) {
        const totalVotes = data.reduce((sum, vote) => sum + vote.vote_amount, 0);
        setVotes(totalVotes);
      }
    };

    fetchVotes();
  }, [dapp?.id]);

  const handleVote = (amount: number, fheData?: { average: number; count: number; uniqueVoters: number }) => {
    setVotes(votes + amount);
    setHasVoted(true);
    
    if (fheData) {
      if (fheData.average > 0) {
        setFheAverage(fheData.average);
      }
      if (fheData.count > 0) {
        setFheCount(fheData.count);
      }
      if (fheData.uniqueVoters > 0) {
        setFheUniqueVoters(fheData.uniqueVoters);
      }
      
      localStorage.removeItem(`fhe_rating_${dapp?.id}`);
    }
  };

  const handleInitializeFHE = async () => {
    if (!dapp?.id || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to Sepolia network",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Auto-Initialize",
      description: "DApp akan otomatis diinisialisasi saat vote pertama. Cast vote sekarang!",
    });
  };

  const getScreenshotsWithPlaceholders = (screenshots: any, isDesktop: boolean) => {
    let validScreenshots: string[] = [];
    
    if (screenshots) {
      if (Array.isArray(screenshots)) {
        
        validScreenshots = screenshots
          .map(s => typeof s === 'string' ? s : s?.url || s?.src || '')
          .filter(Boolean);
      } else if (typeof screenshots === 'string') {
        try {
          
          const parsed = JSON.parse(screenshots);
          validScreenshots = Array.isArray(parsed) 
            ? parsed.map(s => typeof s === 'string' ? s : s?.url || s?.src || '').filter(Boolean)
            : [];
        } catch {
          
          validScreenshots = [screenshots];
        }
      }
    }
    
    const minScreenshots = 3;
    const maxScreenshots = 7;
    
    const limitedScreenshots = validScreenshots.slice(0, maxScreenshots);
    
    const result = [...limitedScreenshots];
    while (result.length < minScreenshots) {
      result.push('placeholder');
    }
    
    return result;
  };

  const desktopScreenshots = getScreenshotsWithPlaceholders(
    dapp?.desktop_screenshots, 
    true
  );

  const mobileScreenshots = getScreenshotsWithPlaceholders(
    dapp?.mobile_screenshots, 
    false
  );

  const logoMap: { [key: string]: string } = {
    "Uniswap": uniswapLogo,
    "Aave": aaveLogo,
    "OpenSea": openseaLogo,
    "Axie Infinity": axieLogo,
    "Compound": compoundLogo,
    "Lens Protocol": lensLogo,
    "PancakeSwap": pancakeswapLogo,
    "The Sandbox": sandboxLogo,
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t('dappDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!dapp) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-2">{t('dappDetail.notFound')}</h1>
          <p className="text-sm text-muted-foreground">{t('dappDetail.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  const logo = logoMap[dapp.name];

  const getPreviewImage = () => {
    
    if (dapp.desktop_screenshots) {
      let screenshots = [];
      if (Array.isArray(dapp.desktop_screenshots)) {
        screenshots = dapp.desktop_screenshots
          .map((s: any) => typeof s === 'string' ? s : s?.url || s?.src || '')
          .filter(Boolean);
      } else if (typeof dapp.desktop_screenshots === 'string') {
        try {
          const parsed = JSON.parse(dapp.desktop_screenshots);
          screenshots = Array.isArray(parsed) 
            ? parsed.map((s: any) => typeof s === 'string' ? s : s?.url || s?.src || '').filter(Boolean)
            : [];
        } catch {
          screenshots = [dapp.desktop_screenshots];
        }
      }
      if (screenshots.length > 0 && screenshots[0] !== 'placeholder') {
        const imgUrl = screenshots[0];
        
        return imgUrl.startsWith('http') ? imgUrl : `${window.location.origin}${imgUrl}`;
      }
    }
    
    if (dapp.mobile_screenshots) {
      let screenshots = [];
      if (Array.isArray(dapp.mobile_screenshots)) {
        screenshots = dapp.mobile_screenshots
          .map((s: any) => typeof s === 'string' ? s : s?.url || s?.src || '')
          .filter(Boolean);
      } else if (typeof dapp.mobile_screenshots === 'string') {
        try {
          const parsed = JSON.parse(dapp.mobile_screenshots);
          screenshots = Array.isArray(parsed) 
            ? parsed.map((s: any) => typeof s === 'string' ? s : s?.url || s?.src || '').filter(Boolean)
            : [];
        } catch {
          screenshots = [dapp.mobile_screenshots];
        }
      }
      if (screenshots.length > 0 && screenshots[0] !== 'placeholder') {
        const imgUrl = screenshots[0];
        return imgUrl.startsWith('http') ? imgUrl : `${window.location.origin}${imgUrl}`;
      }
    }
    
    const fallbackImg = dapp.cover_image || dapp.logo_url || '';
    if (fallbackImg) {
      return fallbackImg.startsWith('http') ? fallbackImg : `${window.location.origin}${fallbackImg}`;
    }
    
    return `${window.location.origin}/favicon.png`;
  };

  const previewImage = getPreviewImage();
  const currentUrl = `${window.location.protocol}//${window.location.host}/dapp/${generateDAppSlug(dapp.name)}`;

  return (
    <>
      <Helmet>
        <title>{dapp.name} - Zapps dApp Store</title>
        <meta name="description" content={dapp.description} />
        
        {}
        <meta property="og:site_name" content="Zapps" />
        <meta property="og:title" content={`${dapp.name} on Zapps`} />
...
        
        {}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zapps" />
        <meta name="twitter:creator" content="@zapps" />
        <meta name="twitter:title" content={`${dapp.name} on Zapps`} />
        <meta name="twitter:description" content={dapp.description} />
        <meta name="twitter:image" content={previewImage} />
        <meta name="twitter:image:alt" content={`${dapp.name} - ${dapp.description}`} />
        
        {}
        <link rel="canonical" href={currentUrl} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      
      {}
      <div className="space-y-4">
        {}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 relative">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-[62px] h-[62px] md:w-[130px] md:h-[130px] rounded-2xl overflow-hidden flex-shrink-0 bg-accent/10 border border-primary/10 mt-1">
              {dapp.logo_url ? (
                <img
                  src={dapp.logo_url}
                  alt={`${dapp.name} logo`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 md:flex md:flex-col md:justify-end" style={{ minHeight: '130px' }}>
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-lg sm:text-2xl font-bold">{dapp.name}</h1>
                {}
                <div className="flex items-center gap-1.5 md:hidden">
                  {dapp.website_url && (
                    <a href={dapp.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                    </a>
                  )}
                  {dapp.twitter && (
                    <a href={dapp.twitter.startsWith('http') ? dapp.twitter : `https://twitter.com/${dapp.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <FaXTwitter className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                    </a>
                  )}
                  {dapp.discord && (
                    <a href={dapp.discord.startsWith('http') ? dapp.discord : `https://discord.gg/${dapp.discord}`} target="_blank" rel="noopener noreferrer">
                      <FaDiscord className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                    </a>
                  )}
                  {dapp.github && (
                    <a href={dapp.github.startsWith('http') ? dapp.github : `https://github.com/${dapp.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                    </a>
                  )}
                  {dapp.docs_url && (
                    <a href={dapp.docs_url} target="_blank" rel="noopener noreferrer">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                    </a>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground leading-snug">
                <span className="hidden sm:inline">{dapp.description}</span>
                <div className="sm:hidden">
                  {dapp.description && dapp.description.length > 62 ? (
                    <>
                      {showFullDescription ? dapp.description : `${dapp.description.slice(0, 62)}`}
                      <button 
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-primary ml-1 font-medium"
                      >
                        {showFullDescription ? 'less...' : 'more...'}
                      </button>
                    </>
                  ) : (
                    dapp.description
                  )}
                </div>
              </div>
              
              {}
              <div className="hidden md:flex items-center gap-2 mt-2">
                {dapp.website_url && (
                  <a href={dapp.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                  </a>
                )}
                {dapp.twitter && (
                  <a href={dapp.twitter.startsWith('http') ? dapp.twitter : `https://twitter.com/${dapp.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    <FaXTwitter className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                  </a>
                )}
                {dapp.discord && (
                  <a href={dapp.discord.startsWith('http') ? dapp.discord : `https://discord.gg/${dapp.discord}`} target="_blank" rel="noopener noreferrer">
                    <FaDiscord className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                  </a>
                )}
                {dapp.github && (
                  <a href={dapp.github.startsWith('http') ? dapp.github : `https://github.com/${dapp.github}`} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                  </a>
                )}
                {dapp.docs_url && (
                  <a href={dapp.docs_url} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {}
          <div className="hidden md:flex flex-col justify-end gap-6 min-w-[180px]" style={{ height: '130px' }}>
            {dapp.website_url && (
              <Button size="sm" className="w-full gap-1" asChild>
                <a href={dapp.website_url} target="_blank" rel="noopener noreferrer">
                  <VenetianMask className="w-6 h-6" />
                  <span>Try it!</span>
                </a>
              </Button>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowVoteModal(true)}
                className="px-2"
              >
                <Vote className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="px-2"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="px-2"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
            
          </div>
          
          {}
          <div className="hidden">
            {dapp.website_url && (
              <a href={dapp.website_url} target="_blank" rel="noopener noreferrer">
                <Globe className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
              </a>
            )}
            {dapp.twitter && (
              <a href={dapp.twitter.startsWith('http') ? dapp.twitter : `https://twitter.com/${dapp.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                <FaXTwitter className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
              </a>
            )}
            {dapp.discord && (
              <a href={dapp.discord.startsWith('http') ? dapp.discord : `https://discord.gg/${dapp.discord}`} target="_blank" rel="noopener noreferrer">
                <FaDiscord className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
              </a>
            )}
            {dapp.github && (
              <a href={dapp.github.startsWith('http') ? dapp.github : `https://github.com/${dapp.github}`} target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
              </a>
            )}
            {dapp.docs_url && (
              <a href={dapp.docs_url} target="_blank" rel="noopener noreferrer">
                <BookOpen className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-smooth" />
              </a>
            )}
          </div>
        </div>

        <div className="hidden">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-[62px] h-[62px] md:w-[130px] md:h-[130px] rounded-2xl overflow-hidden flex-shrink-0 bg-accent/10 border border-primary/10 mt-1">
            </div>
            <div className="flex-1 min-w-0">
            </div>
          </div>

          {}
          <div className="hidden md:flex flex-col gap-2 min-w-[140px]">
            {dapp.website_url && (
              <Button size="sm" className="w-full gap-1" asChild>
                <a href={dapp.website_url} target="_blank" rel="noopener noreferrer">
                  <VenetianMask className="w-6 h-6" />
                  <span className="text-xs">Try it!</span>
                </a>
              </Button>
            )}
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setShowVoteModal(true)}
              >
                <Vote className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" className="flex-1">
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {}
        <div className="flex gap-2 md:hidden">
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="px-2"
              onClick={() => setShowVoteModal(true)}
            >
              <Vote className="w-6 h-6" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="px-2"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-6 h-6" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="px-2"
              onClick={() => setShowReportDialog(true)}
            >
              <Flag className="w-6 h-6" />
            </Button>
            
          </div>
          
          {dapp.website_url && (
            <Button size="sm" className="flex-1 gap-1" asChild>
              <a href={dapp.website_url} target="_blank" rel="noopener noreferrer">
                <VenetianMask className="w-6 h-6" />
                <span className="text-xs">Try it!</span>
              </a>
            </Button>
          )}
        </div>

        {}
        <VoteModal
          isOpen={showVoteModal}
          onClose={() => setShowVoteModal(false)}
          dappName={dapp.name}
          dappId={dapp.id}
          currentVotes={votes}
          onVote={handleVote}
        />

        {}
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          dappName={dapp.name}
          dappDescription={dapp.description}
          dappUrl={currentUrl}
          dappCategory={dapp.category}
          dappTwitter={dapp.twitter}
        />

        {}
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          dappId={dapp.id}
          dappName={dapp.name}
        />
      </div>

      {}
      <div className="grid grid-cols-4 md:gap-4 md:border-0">
          <div className="text-center py-4 border-t border-b border-border md:border md:rounded-lg md:bg-accent/5">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Star className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
              <div className="text-xs md:text-sm font-semibold">
                <span className="md:hidden">Rating</span>
                <span className="hidden md:inline">{t('dappDetail.ratingScore')}</span>
              </div>
            </div>
            {}
            {(() => {
              
              const dbScore = scores.vote_score ? (Number(scores.vote_score) > 5 ? Number(scores.vote_score) / 2 : Number(scores.vote_score)) : 0;
              const displayRating = (fheAverage && fheAverage > 0) ? fheAverage : dbScore > 0 ? dbScore : (dapp?.rating || 0);
              const voteCount = fheCount || 0;
              
              if (displayRating > 0) {
                return (
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <StarRating rating={displayRating} size={16} />
                    {voteCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">({voteCount} votes)</span>
                    )}
                  </div>
                );
              } else if (voteCount > 0) {
                
                return (
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1 text-xs text-primary/70">
                      <VenetianMask className="w-3 h-3" />
                      <span>Encrypted</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{voteCount} votes pending</span>
                  </div>
                );
              } else {
                return <div className="text-xs md:text-base text-muted-foreground">-</div>;
              }
            })()}
          </div>
          
          {}
          <div className="text-center border-t border-b border-border py-4 relative before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-px before:bg-border md:border md:rounded-lg md:bg-accent/5 md:before:hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Vote className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
              <div className="text-xs md:text-sm font-semibold truncate max-w-[60px] md:max-w-none">
                <span className="md:hidden">Votes</span>
                <span className="hidden md:inline">Total Votes</span>
              </div>
            </div>
            <div className="text-xs md:text-base">
              {fheCount !== null && fheCount > 0 ? (
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{fheCount}</span>
                  {fheUniqueVoters !== null && fheUniqueVoters > 0 && (
                    <span className="text-[10px] text-muted-foreground">{fheUniqueVoters} voters</span>
                  )}
                </div>
              ) : votes > 0 ? (
                <span className="font-semibold">{votes.toLocaleString()}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>
          
          <div className="text-center border-t border-b border-border py-4 relative before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-px before:bg-border md:border md:rounded-lg md:bg-accent/5 md:before:hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
              <div className="text-xs md:text-sm font-semibold truncate max-w-[60px] md:max-w-none">
                <span className="md:hidden">Trust</span>
                <span className="hidden md:inline">{t('dappDetail.trustScore')}</span>
              </div>
            </div>
            <div className="text-xs md:text-base text-muted-foreground">
              {scores.trust_score}
            </div>
          </div>
          
          <div className="text-center border-t border-b border-border py-4 relative before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-px before:bg-border md:border md:rounded-lg md:bg-accent/5 md:before:hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Heart className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
              <div className="text-xs md:text-sm font-semibold truncate max-w-[60px] md:max-w-none">
                <span className="md:hidden">Social...</span>
                <span className="hidden md:inline">{t('dappDetail.socialScore')}</span>
              </div>
            </div>
            <div className="text-xs md:text-base text-muted-foreground">
              {scores.social_score > 0 ? scores.social_score.toFixed(1) : 'N/A'}
            </div>
          </div>
      </div>

      {}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold">{t('dappDetail.overview')}</h2>
          <div className="flex items-center border border-border rounded-md p-0.5">
            <button
              onClick={() => setIsMobileView(false)}
              className="p-1 transition-smooth"
            >
              <Monitor className={`w-3 h-3 ${!isMobileView ? 'text-primary' : 'text-muted-foreground'}`} />
            </button>
            <button
              onClick={() => setIsMobileView(true)}
              className="p-1 transition-smooth"
            >
              <Smartphone className={`w-3 h-3 ${isMobileView ? 'text-primary' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>
        
        <Carousel 
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
          data-carousel="preview"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {(isMobileView ? mobileScreenshots : desktopScreenshots).map((screenshot, index) => (
              <CarouselItem key={index} className={`pl-2 md:pl-4 ${isMobileView ? 'basis-1/3 md:basis-1/4 lg:basis-1/6' : 'basis-full md:basis-1/2 lg:basis-1/3'}`}>
                <div className={`${isMobileView ? 'aspect-[9/17]' : 'aspect-[160/96]'} rounded-lg overflow-hidden bg-accent/10 border border-primary/10`}>
                  {screenshot === 'placeholder' ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted/20">
                      <p className="text-xs text-muted-foreground">Preview not available</p>
                    </div>
                  ) : (
                    <img
                      src={screenshot}
                      alt={`${dapp.name} ${isMobileView ? 'mobile' : 'desktop'} preview ${index + 1}`}
                      className={`w-full h-full ${isMobileView ? 'object-cover' : 'object-cover object-top'} hover:scale-105 transition-smooth cursor-pointer`}
                    />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {}
        <div className="relative border-b border-border mb-6">
          <div className="grid grid-cols-4 md:flex md:gap-8 md:justify-start">
            {[
              { value: "about", label: t('dappDetail.about') },
              { value: "analytics", label: t('dappDetail.analytics') },
              { value: "updates", label: t('dappDetail.updates') },
              { value: "discussion", label: t('dappDetail.discussion') }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`py-3 text-xs md:text-sm font-medium relative transition-colors ${
                  activeTab === tab.value 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {}
                {activeTab === tab.value && (
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
          {}
          <div 
            className="md:hidden absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
            style={{
              width: '25%',
              left: `${['about', 'analytics', 'updates', 'discussion'].indexOf(activeTab) * 25}%`
            }}
          />
        </div>

        {}
        <TabsContent value="about" className="space-y-6">
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3">{t('dappDetail.about')} {dapp.name}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {}
              <div className="sm:hidden">
                {showFullAbout || !dapp.long_description || dapp.long_description.length <= 160 
                  ? (dapp.long_description || dapp.description)
                  : `${dapp.long_description.slice(0, 160)}...`
                }
                {dapp.long_description && dapp.long_description.length > 160 && (
                  <button
                    onClick={() => setShowFullAbout(!showFullAbout)}
                    className="text-primary hover:text-primary/80 transition-colors ml-1 font-medium"
                  >
                    {showFullAbout ? t('common.viewAll').replace('All', 'less') : t('common.viewAll').replace('All', 'more')}
                  </button>
                )}
              </div>
              {}
              <div className="hidden sm:block">
                {dapp.long_description || dapp.description}
              </div>
            </div>
          </div>

          <Separator />

          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {}
            {dapp.features && (
              <div>
                <h2 className="text-base md:text-lg font-semibold mb-4">{t('dappDetail.features')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  {dapp.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-xs font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <div className="space-y-6">
              {}
              <div>
                <h2 className="text-base md:text-lg font-semibold mb-4">Quick Info</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Votes</span>
                    <span className="text-sm font-medium">{votes.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="badge-category text-xs">{dapp.category}</span>
                  </div>
                  {dapp.tags && (
                    <>
                      <Separator />
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-muted-foreground flex-shrink-0">Tags</span>
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-end min-w-0 flex-1 -mr-4 pr-4 sm:mr-0 sm:pr-0">
                            {}
                            {dapp.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="flex-shrink-0 px-2 py-1 bg-accent/20 text-accent-foreground rounded-lg text-xs whitespace-nowrap">
                                {tag}
                              </span>
                            ))}
                            {}
                            {dapp.tags.slice(3).map((tag, index) => (
                              <span key={index + 3} className="hidden sm:flex flex-shrink-0 px-2 py-1 bg-accent/20 text-accent-foreground rounded-lg text-xs whitespace-nowrap">
                                {tag}
                              </span>
                            ))}
                            {}
                            {dapp.tags.length > 3 && (
                              <span className="sm:hidden flex-shrink-0 px-2 py-1 bg-accent/10 text-muted-foreground rounded-lg text-xs whitespace-nowrap">
                                +{dapp.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </TabsContent>

        {}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold">{t('dappDetail.analytics')}</h2>
            <div className="flex gap-1">
              {["1D", "7D", "30D"].map((period) => (
                <button
                  key={period}
                  onClick={() => setAnalyticsFilter(period)}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    analyticsFilter === period 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 md:grid-cols-4 md:gap-4 md:border-0">
            {}
            <button
              onClick={() => setSelectedMetric(selectedMetric === "interactions" ? "all" : "interactions")}
              className="p-3 md:p-4 border-r border-b border-border text-left hover:bg-accent/10 transition-colors md:border md:rounded-lg md:bg-accent/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <MousePointer className="w-3.5 h-3.5 text-primary" />
                <div className="text-sm font-bold text-primary">
                  {analyticsData.totalInteractions > 0 ? analyticsData.totalInteractions.toLocaleString() : '-'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Total Interactions</div>
            </button>

            {}
            <button
              onClick={() => setSelectedMetric(selectedMetric === "users" ? "all" : "users")}
              className="p-3 md:p-4 border-b border-border text-left hover:bg-accent/10 transition-colors md:border md:rounded-lg md:bg-accent/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                <div className="text-sm font-bold text-primary">
                  {analyticsData.totalUsers > 0 ? analyticsData.totalUsers.toLocaleString() : '-'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </button>

            {}
            <button
              onClick={() => setSelectedMetric(selectedMetric === "tvl" ? "all" : "tvl")}
              className="p-3 md:p-4 border-r border-border text-left hover:bg-accent/10 transition-colors md:border-0 md:border md:rounded-lg md:bg-accent/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <div className="text-sm font-bold text-primary">
                  {dapp?.tvl ? `$${(dapp.tvl / 1000000).toFixed(1)}M` : '-'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Total Value Locked</div>
            </button>

            {}
            <button
              onClick={() => setSelectedMetric(selectedMetric === "volume" ? "all" : "volume")}
              className="p-3 md:p-4 text-left hover:bg-accent/10 transition-colors md:border md:rounded-lg md:bg-accent/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-green-500" />
                <div className="text-sm font-bold text-green-500">-</div>
              </div>
              <div className="text-xs text-muted-foreground">24h Volume</div>
            </button>
          </div>

          {}
          <div className="space-y-3">
            <h3 className="text-sm md:text-base font-medium">
              {selectedMetric === "all" ? "All Metrics" : 
               selectedMetric === "interactions" ? "Total Interactions" :
               selectedMetric === "users" ? "Total Users" :
               selectedMetric === "tvl" ? "Total Value Locked" : "24h Volume"} Chart
            </h3>
            <div className="h-40 md:h-64 rounded-lg border border-border flex items-center justify-center bg-muted/10">
              <p className="text-sm text-muted-foreground">Chart data will be integrated soon</p>
            </div>
          </div>
        </TabsContent>

        {}
        <TabsContent value="updates" className="space-y-4">
          <UpdatesSection dappName={dapp?.name || ''} dappTwitter={dapp?.twitter || null} />
        </TabsContent>

        {}
        <TabsContent value="discussion" className="space-y-4">
          {dapp?.id && <DiscussionThread dappId={dapp.id} />}
        </TabsContent>
      </Tabs>

      {}
      <div className="space-y-4">
        <h2 className="text-base md:text-lg font-semibold">{t('dappDetail.relatedDapps')}</h2>
        {isLoadingRelated ? (
          <div className="md:hidden -mx-4">
            <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-4 px-4 snap-x snap-mandatory">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-none basis-[calc((100vw-4rem)/3)] snap-center">
                  <div className="w-full aspect-square bg-accent/10 rounded-lg animate-pulse mb-2" />
                  <div className="h-3 bg-accent/10 rounded animate-pulse mb-1" />
                  <div className="h-2 bg-accent/10 rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden -mx-4">
              <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-4 px-4 snap-x snap-mandatory">
                {relatedDApps.slice(0, 6).map((relatedDapp) => (
                  <RouterLink key={relatedDapp.id} to={`/dapp/${generateDAppSlug(relatedDapp.name)}`} className="flex-none basis-[calc((100vw-4rem)/3)] snap-center cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-accent/10 border border-primary/10 mb-2">
                      {relatedDapp.logo_url ? (
                        <img
                          src={relatedDapp.logo_url}
                          alt={`${relatedDapp.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
                          <span className="text-sm font-semibold text-foreground">
                            {(relatedDapp.name || '').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold mb-1 truncate">{relatedDapp.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{relatedDapp.category}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-0.5">
                          <Star className="w-3 h-3 fill-current text-yellow-500" />
                          <span className="text-[11px] font-medium">
                            {formatRating(getDisplayRating(relatedDapp.dapp_scores?.[0]?.vote_score as any, relatedRatingAverages[relatedDapp.id], relatedDapp.rating))}
                          </span>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          <Vote className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{relatedVoteCounts[relatedDapp.id] || 0}</span>
                        </div>
                      </div>
                    </div>
                  </RouterLink>
                ))}
              </div>
            </div>

            <div className="hidden md:grid md:grid-cols-6 md:gap-4">
              {relatedDApps.slice(0, 6).map((relatedDapp) => (
                <RouterLink key={relatedDapp.id} to={`/dapp/${generateDAppSlug(relatedDapp.name)}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-accent/10 border border-primary/10 mb-2">
                    {relatedDapp.logo_url ? (
                      <img
                        src={relatedDapp.logo_url}
                        alt={`${relatedDapp.name} logo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
                        <span className="text-sm font-semibold text-foreground">
                          {(relatedDapp.name || '').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold mb-1 truncate">{relatedDapp.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{relatedDapp.category}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-0.5">
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                        <span className="text-[11px] font-medium">
                          {formatRating(getDisplayRating(relatedDapp.dapp_scores?.[0]?.vote_score as any, relatedRatingAverages[relatedDapp.id], relatedDapp.rating))}
                        </span>
                      </div>
                      <div className="flex items-center space-x-0.5">
                        <Vote className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{relatedVoteCounts[relatedDapp.id] || 0}</span>
                      </div>
                    </div>
                  </div>
                </RouterLink>
              ))}
            </div>
          </>
        )}
      </div>
      
      </div>
    </>
  );
};

export default DAppDetail;