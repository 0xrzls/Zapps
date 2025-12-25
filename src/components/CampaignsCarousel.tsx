import { Users, Clock, Coins, Image, MessageSquare, Gamepad2, GraduationCap, Network, Award, Hexagon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { backend } from "@/services";
import { Link } from "react-router-dom";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  logo: string;
  reward_amount: number;
  reward_token: string;
  start_date: string;
  end_date: string;
  status: string;
  participants_count: number;
  hosted_by: string[];
}

const CampaignsCarousel = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  useEffect(() => {
    const fetchFeaturedCampaigns = async () => {
      const { data, error } = await backend.campaigns.getFeatured(5);
      
      if (data) {
        
        const filtered = data.filter(c => c.display_target === 'campaigns');
        setCampaigns(filtered as Campaign[]);
      }
    };
    
    fetchFeaturedCampaigns();
  }, []);
  
  const carouselCampaigns = campaigns;

  const initialRemaining = useMemo(() => {
    return carouselCampaigns.map((campaign) => {
      const targetDate = campaign.status === 'draft' 
        ? new Date(campaign.start_date)
        : new Date(campaign.end_date);
      const diff = targetDate.getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    });
  }, [carouselCampaigns]);

  const [remaining, setRemaining] = useState(initialRemaining);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) =>
        prev.map((seconds) => Math.max(0, seconds - 1))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatTime = (seconds: number, isDraft: boolean = false) => {
    if (seconds <= 0) return isDraft ? "Opening..." : "Ended";
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DeFi":
        return <Coins className="w-2.5 h-2.5" />;
      case "NFT":
        return <Image className="w-2.5 h-2.5" />;
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

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "NFT":
        return <Hexagon className="w-3 h-3" />;
      case "POINT":
        return <Coins className="w-3 h-3" />;
      case "ROLE":
        return <Award className="w-3 h-3" />;
      default:
        return <Coins className="w-3 h-3" />;
    }
  };

  const getRewardStyle = (type: string) => {
    switch (type) {
      case "NFT":
        return "bg-purple-100/90 text-purple-700 border-purple-200/60 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/40";
      case "POINT":
        return "bg-amber-100/90 text-amber-700 border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/40";
      case "ROLE":
        return "bg-blue-100/90 text-blue-700 border-blue-200/60 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/40";
      default:
        return "bg-gray-100/90 text-gray-700 border-gray-200/60 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/40";
    }
  };

  const getRewardLabel = (type: string) => {
    switch (type) {
      case "NFT":
        return "NFT";
      case "POINT":
        return "Point";
      case "ROLE":
        return "Role";
      default:
        return type;
    }
  };

  return (
    <>
      {}
      <div className="md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 2000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {carouselCampaigns.map((campaign, index) => (
              <CarouselItem key={campaign.id}>
                <Link to={`/campaign/${campaign.id}`} className="block group">
                  <div className="relative overflow-hidden">
                    <div className="border border-border/50 rounded-2xl overflow-hidden hover:border-primary/20 transition-smooth cursor-pointer">
                      {}
                      <div className={`relative h-28 overflow-hidden ${
                        campaign.status === "ended" ? "opacity-60" : ""
                      }`}>
                        <img 
                          src={campaign.cover_image} 
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                          style={{ WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)', maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)' }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background)/0.95)_15%,hsl(var(--background)/0.7)_30%,hsl(var(--background)/0.3)_50%,transparent_70%)]" />

                        {}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="p-3 pt-2 pb-3">
                        {}
                        <div className="flex items-start gap-3 mb-2">
                          {}
                          <div className="relative z-10 w-14 h-14 rounded-xl border-4 border-background bg-card overflow-hidden flex-shrink-0 -mt-[60px]">
                            <img 
                              src={campaign.logo} 
                              alt={`${campaign.title} logo`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {}
                          <div className="relative z-10 flex-1 min-w-0 -mt-11">
                            <h3 className="font-semibold text-xs md:text-sm text-foreground group-hover:text-primary transition-smooth line-clamp-1">
                              {campaign.title.length > 19 ? campaign.title.substring(0, 19) + "..." : campaign.title}
                            </h3>
                          </div>
                        </div>

                        {}
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {campaign.description}
                        </p>

                        {}
                        <div className="-mx-3 mb-2 border-t border-border/50" />

                        {}
                        <div className="flex items-center justify-between gap-3">
                          {}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {campaign.reward_amount && campaign.reward_token !== 'NFT' && campaign.reward_token !== 'Badge' && campaign.reward_token !== 'Discord Role' ? (
                              <div className="flex items-center gap-1 text-[10px] rounded-full px-2.5 py-0.5 border bg-amber-100/90 text-amber-700 border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/40">
                                <Coins className="w-3 h-3 flex-shrink-0" />
                                <span className="font-medium whitespace-nowrap">
                                  {campaign.reward_amount} {campaign.reward_token}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] rounded-full px-2.5 py-0.5 border bg-purple-100/90 text-purple-700 border-purple-200/60 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/40">
                                <span className="font-medium whitespace-nowrap">
                                  {campaign.reward_token}
                                </span>
                              </div>
                            )}
                          </div>

                          {}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">by</span>
                            <div className="flex items-center -space-x-1.5">
                              {campaign.hosted_by?.map((logo: string, idx: number) => (
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
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {carouselCampaigns.map((campaign, index) => (
          <Link to={`/campaign/${campaign.id}`} key={campaign.id} className="group">
            <div className="relative overflow-hidden">
              <div className="border border-border/50 rounded-2xl overflow-hidden hover:border-primary/20 transition-smooth">
                {}
                <div className={`relative h-24 overflow-hidden ${
                  campaign.status === "completed" ? "opacity-60" : ""
                }`}>
                  <img 
                    src={campaign.cover_image} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    style={{ WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)', maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 75%)' }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background)/0.95)_15%,hsl(var(--background)/0.7)_30%,hsl(var(--background)/0.3)_50%,transparent_70%)]" />

                  {}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>
                </div>

                {}
                <div className="p-3 pt-2 pb-3">
                  {}
                  <div className="flex items-start gap-3 mb-2">
                    {}
                    <div className="relative z-10 w-12 h-12 rounded-xl border-4 border-background bg-card overflow-hidden flex-shrink-0 -mt-[52px]">
                      <img 
                        src={campaign.logo} 
                        alt={`${campaign.title} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {}
                    <div className="relative z-10 flex-1 min-w-0 -mt-9">
                      <h3 className="font-semibold text-xs md:text-sm text-foreground group-hover:text-primary transition-smooth line-clamp-1">
                        {campaign.title.length > 19 ? campaign.title.substring(0, 19) + "..." : campaign.title}
                      </h3>
                    </div>
                  </div>

                  {}
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {campaign.description}
                  </p>

                  {}
                  <div className="-mx-3 mb-2 border-t border-border/50" />

                  {}
                  <div className="flex items-center justify-between gap-3">
                    {}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {campaign.reward_amount && campaign.reward_token !== 'NFT' && campaign.reward_token !== 'Badge' && campaign.reward_token !== 'Discord Role' ? (
                        <div className="flex items-center gap-1 text-[10px] rounded-full px-2.5 py-0.5 border bg-amber-100/90 text-amber-700 border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/40">
                          <Coins className="w-3 h-3 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">
                            {campaign.reward_amount} {campaign.reward_token}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] rounded-full px-2.5 py-0.5 border bg-purple-100/90 text-purple-700 border-purple-200/60 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/40">
                          <span className="font-medium whitespace-nowrap">
                            {campaign.reward_token}
                          </span>
                        </div>
                      )}
                    </div>

                    {}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">by</span>
                      <div className="flex items-center -space-x-1.5">
                        {campaign.hosted_by?.map((logo: string, idx: number) => (
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
            </div>
          </Link>
        ))}
      </div>
    </>
  );
};

export default CampaignsCarousel;
