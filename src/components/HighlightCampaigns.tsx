import { useEffect, useState, useMemo } from "react";
import { Users, Clock, ChevronRight, Gift, Hexagon, Coins, Award, MessageSquare, Gamepad2, GraduationCap, Network, Image as ImageIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { backend } from "@/services";
import zamaLogo from "@/assets/zama-logo.png";
import { useTranslation } from "react-i18next";

const HighlightCampaigns = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const isLocked = false; 

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const result = await backend.campaigns.getFeatured(4);
        setCampaigns(result.data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
      setLoading(false);
    };

    fetchCampaigns();
  }, []);

  const initialRemaining = useMemo(() => {
    return campaigns.map((campaign) => {
      const endDate = new Date(campaign.end_date);
      const diff = endDate.getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    });
  }, [campaigns]);

  const [remaining, setRemaining] = useState(initialRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) =>
        prev.map((seconds) => Math.max(0, seconds - 1))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setRemaining(initialRemaining);
  }, [initialRemaining]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Ended";
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const mins = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "upcoming":
        return "bg-blue-100/80 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case "ended":
        return "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
      default:
        return "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DeFi":
        return <Coins className="w-2.5 h-2.5" />;
      case "NFT":
        return <ImageIcon className="w-2.5 h-2.5" />;
      case "Social":
        return <MessageSquare className="w-2.5 h-2.5" />;
      case "Gaming":
        return <Gamepad2 className="w-2.5 h-2.5" />;
      case "Infrastructure":
        return <Network className="w-2.5 h-2.5" />;
      default:
        return <GraduationCap className="w-2.5 h-2.5" />;
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderCampaignCard = (campaign: any, index: number, isMobile: boolean) => {
    const hostedByArray = campaign.hosted_by || [zamaLogo];
    
    return (
      <Link 
        key={campaign.id} 
        to={`/campaign/${campaign.id}`} 
        className={isMobile ? "flex-shrink-0 w-[calc(100vw-2rem)] snap-center" : ""}
        onClick={(e) => isLocked && e.preventDefault()}
      >
        <div className={`relative border border-border/50 rounded-2xl overflow-hidden hover:border-primary/20 transition-smooth ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          {}
          {isLocked && (
            <>
              <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-30 pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <div className="flex items-center justify-center gap-2 bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm border border-border/50">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Coming Soon</span>
                </div>
              </div>
            </>
          )}
          
          {}
          <div className={`relative ${isMobile ? 'h-28' : 'h-24'} overflow-hidden ${
            campaign.status === "ended" ? "opacity-60" : ""
          }`}>
            <img 
              src={campaign.cover_image || zamaLogo} 
              alt={campaign.title}
              className="w-full h-full object-cover"
              style={{ WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)', maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background)/0.95)_15%,hsl(var(--background)/0.7)_30%,hsl(var(--background)/0.3)_50%,transparent_70%)]" />
            
            {}
            <div className="absolute top-2 left-3">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
                campaign.status === "upcoming" 
                  ? "bg-red-100/80 text-red-800 dark:bg-red-900/50 dark:text-red-300" 
                  : campaign.status === "active"
                  ? "bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-gray-100/80 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
              }`}>
                <Clock className="w-2.5 h-2.5" />
                {formatTime(remaining[index] || 0)}
              </div>
            </div>

            {}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {campaign.category && (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
                  {getCategoryIcon(campaign.category)}
                  {campaign.category}
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
          </div>

          {}
          <div className="p-5 pt-2 pb-3">
            {}
            <div className="flex items-start gap-3 mb-3">
              {}
              <div className="relative z-10 w-14 h-14 rounded-xl border-4 border-background bg-card overflow-hidden flex-shrink-0 -mt-[60px]">
                <img 
                  src={campaign.logo || zamaLogo} 
                  alt={`${campaign.title} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {}
              <div className="relative z-10 flex-1 min-w-0 -mt-11">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-smooth line-clamp-1 flex-1 min-w-0">
                    {campaign.title.length > 18 ? campaign.title.substring(0, 18) + "..." : campaign.title}
                  </h3>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{campaign.participants_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <p className="text-xs text-muted-foreground -mt-2 mb-3">
              {expandedDescriptions[campaign.id] || (campaign.description?.length || 0) <= 35
                ? campaign.description
                : campaign.description?.substring(0, 35) + "... "}
              {!expandedDescriptions[campaign.id] && (campaign.description?.length || 0) > 35 && (
                <span 
                  className="text-primary cursor-pointer hover:underline"
                  onClick={(e) => { e.preventDefault(); toggleDescription(campaign.id); }}
                >
                  show more
                </span>
              )}
              {expandedDescriptions[campaign.id] && (campaign.description?.length || 0) > 35 && (
                <span 
                  className="text-primary cursor-pointer hover:underline ml-1"
                  onClick={(e) => { e.preventDefault(); toggleDescription(campaign.id); }}
                >
                  show less
                </span>
              )}
            </p>

            {}
            <div className="-mx-5 mb-2 border-t border-border/50" />

            {}
            <div className="flex items-center justify-between gap-3">
              {}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center space-x-1 text-[10px] rounded-full px-2.5 py-0.5 border bg-amber-100/90 text-amber-700 border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/40">
                  <Coins className="w-3 h-3" />
                  <span className="font-medium">{campaign.reward_amount || 0} {campaign.reward_token || 'Points'}</span>
                </div>
              </div>

              {}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">hosted by:</span>
                <div className="flex items-center -space-x-1.5">
                  {hostedByArray.map((logo: string, idx: number) => (
                    <div key={idx} className="w-5 h-5 rounded-full border-2 border-background bg-card overflow-hidden">
                      <img 
                        src={logo} 
                        alt="Host logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const renderSkeleton = (isMobile: boolean) => (
    <div className={isMobile ? "flex-shrink-0 w-[calc(100vw-2rem)] snap-center" : ""}>
      <div className="border border-border/50 rounded-2xl overflow-hidden">
        <Skeleton className={isMobile ? "h-28 w-full" : "h-36 w-full"} />
        <div className="p-5 pt-2 pb-3 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-xl ${isMobile ? '-mt-[60px]' : '-mt-[68px]'}`} />
            <div className="flex-1 space-y-2 -mt-11">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Featured Campaigns</h2>
        </div>
        <Link to="/campaigns">
          <Button variant="ghost" className="text-primary hover:text-primary/80 -mr-3 hover:bg-transparent">
            {t('dapps.viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {}
      <div className="md:hidden -mx-4">
        {loading ? (
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-4 px-4 snap-x snap-mandatory">
            {[1, 2, 3, 4].map((i) => renderSkeleton(true))}
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-4 px-4 snap-x snap-mandatory">
            {campaigns.map((campaign, index) => renderCampaignCard(campaign, index, true))}
          </div>
        )}
      </div>

      {}
      <div className="hidden md:block">
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>{renderSkeleton(false)}</div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {campaigns.map((campaign, index) => renderCampaignCard(campaign, index, false))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HighlightCampaigns;