import HeroBanner from "@/components/HeroBanner";
import HotDApps from "@/components/HotDApps";
import FeaturedDApps from "@/components/FeaturedDApps";
import HighlightCampaigns from "@/components/HighlightCampaigns";
import LatestDApps from "@/components/LatestDApps";
import GenesisOperators from "@/components/GenesisOperators";
import MostVoted from "@/components/MostVoted";
import { Separator } from "@/components/ui/separator";
import { Gift, Coins, Gamepad2, TrendingUp, Rss } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Gift, label: t('home.reward'), path: "/rewards", locked: false },
    { icon: Coins, label: "Point", path: "/dapps", locked: true },
    { icon: Gamepad2, label: t('home.game'), path: "/games", locked: true },
    { icon: TrendingUp, label: t('home.analytics'), path: "/analytics", locked: false },
    { icon: Rss, label: t('home.news'), path: "/news", locked: false }
  ];

  return (
    <div className="space-y-0">
      <HeroBanner />
      
      <div className="bg-background rounded-t-3xl shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_-5px_rgba(255,255,255,0.1)] relative z-20 pt-4">
        <div className="container mx-auto px-4 pt-4 md:hidden max-w-7xl">
          <div className="flex justify-between items-center">
            {menuItems.map(({ icon: Icon, label, path, locked }) => (
              <div 
                key={label} 
                onClick={() => !locked && navigate(path)}
                className={`flex flex-col items-center gap-2 relative ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'}`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-accent flex items-center justify-center bg-accent/10 ${!locked && 'group-hover:bg-accent/20 group-hover:border-primary'} transition-smooth`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground ${!locked && 'group-hover:text-primary'}`} />
                </div>
                <span className={`text-xs sm:text-sm font-medium text-muted-foreground ${!locked && 'group-hover:text-foreground'} transition-smooth`}>
                  {label}
                </span>
                {locked && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {t('home.soon')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-8 space-y-4 max-w-7xl">
          <HotDApps />
          <Separator className="hidden md:block my-8" />
          <FeaturedDApps />
          <Separator className="hidden md:block my-8" />
          <HighlightCampaigns />
          <Separator className="hidden md:block my-8" />
          <LatestDApps />
          <Separator className="hidden md:block my-8" />
          <GenesisOperators />
          <Separator className="hidden md:block my-8" />
          <MostVoted />
        </div>
      </div>
    </div>
  );
};

export default Home;