import { Flame, Star, Vote, Globe, Twitter, Github } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateDAppSlug, getDisplayRating, formatRating } from "@/lib/utils";
import { useHotDApps } from "@/services/hooks";
import uniswapLogo from "@/assets/uniswap-logo.png";

const HotDApps = () => {
  const { dapps: hotDApps, voteCounts, ratingAverages, scoresById, loading } = useHotDApps(5);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileScrollRef.current || hotDApps.length === 0) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (mobileScrollRef.current) {
        currentIndex = (currentIndex + 1) % hotDApps.length;
        const containerWidth = mobileScrollRef.current.offsetWidth;
        const gap = 16; 
        mobileScrollRef.current.scrollTo({
          left: (containerWidth + gap) * currentIndex,
          behavior: 'smooth'
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [hotDApps]);

  useEffect(() => {
    if (!desktopScrollRef.current || hotDApps.length === 0) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (desktopScrollRef.current) {
        currentIndex = (currentIndex + 1) % hotDApps.length;
        const scrollWidth = desktopScrollRef.current.scrollWidth;
        const itemWidth = scrollWidth / hotDApps.length;
        desktopScrollRef.current.scrollTo({
          left: itemWidth * currentIndex,
          behavior: 'smooth'
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [hotDApps]);

  if (loading) {
    return (
      <section>
        {}
        <div className="md:hidden -mx-4">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-4 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center">
                <div className="rounded-2xl border border-accent/20 bg-card/50 backdrop-blur-sm px-4 py-2">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-[69px] h-[69px] rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {}
        <div className="hidden md:block py-2">
          <div className="flex overflow-x-auto scrollbar-hide gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-[0_0_calc(25%-1rem)] min-w-0">
                <div className="rounded-2xl border border-accent/20 bg-card/50 backdrop-blur-sm px-3 py-3">
                  <div className="flex items-center space-x-2.5">
                    <Skeleton className="w-[59px] h-[59px] rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      {}
      <div className="md:hidden -mx-4">
        <div ref={mobileScrollRef} className="flex overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-4 gap-4">
          {hotDApps.map((dapp) => (
            <div key={dapp.id} className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center">
              <Link to={`/dapp/${generateDAppSlug(dapp.name)}`}>
                <div className="game-card rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent relative backdrop-blur-sm px-4 py-2 card-shadow hover:glow-effect transition-smooth cursor-pointer hover:scale-[1.02] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-yellow-500/3 before:via-transparent before:to-orange-500/5 before:pointer-events-none">
                  <div className="flex items-center space-x-3">
                    <div className="w-[69px] h-[69px] rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={dapp.logo_url || uniswapLogo}
                        alt={`${dapp.name} logo`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain p-1.5 rounded-xl translate-y-[4%]"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm leading-tight text-foreground truncate">{dapp.name}</h3>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 ml-2 flex-shrink-0">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-[10px] font-medium text-orange-500">Hot</span>
                        </div>
                      </div>
                      <p className="text-[11px] leading-snug text-muted-foreground truncate mb-2">{dapp.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            <span className="text-xs font-medium">{formatRating(getDisplayRating(scoresById[dapp.id], ratingAverages[dapp.id], dapp.rating))}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Vote className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{voteCounts[dapp.id] || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {dapp.website_url && (
                            <a href={dapp.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Globe className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                            </a>
                          )}
                          {dapp.twitter && (
                            <a href={`https://twitter.com/${dapp.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Twitter className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                            </a>
                          )}
                          {dapp.discord && (
                            <a href={`https://discord.gg/${dapp.discord}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <FaDiscord className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                            </a>
                          )}
                          {dapp.github && (
                            <a href={`https://github.com/${dapp.github}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Github className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="hidden md:block py-2">
        <div ref={desktopScrollRef} className="flex overflow-x-auto scrollbar-hide gap-4">
        {hotDApps.map((dapp) => (
          <div key={dapp.id} className="flex-[0_0_calc(25%-1rem)] min-w-0">
            <Link to={`/dapp/${generateDAppSlug(dapp.name)}`}>
              <div className="game-card rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent relative backdrop-blur-sm px-3 py-3 card-shadow hover:glow-effect transition-smooth cursor-pointer hover:scale-[1.02] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-yellow-500/3 before:via-transparent before:to-orange-500/5 before:pointer-events-none">
                <div className="flex items-center space-x-2.5">
                  <div className="w-[59px] h-[59px] rounded-2xl overflow-hidden flex-shrink-0">
                    <img
                      src={dapp.logo_url || uniswapLogo}
                      alt={`${dapp.name} logo`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-1.5 rounded-xl translate-y-[4%]"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm leading-tight text-foreground truncate">{dapp.name}</h3>
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 ml-2 flex-shrink-0">
                        <Flame className="w-2.5 h-2.5 text-orange-500" />
                        <span className="text-[9px] font-medium text-orange-500">Hot</span>
                      </div>
                    </div>
                    <p className="text-[10px] leading-snug text-muted-foreground truncate mb-1.5">{dapp.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-0.5">
                          <Star className="w-2.5 h-2.5 fill-current text-yellow-500" />
                          <span className="text-[10px] font-medium">{formatRating(getDisplayRating(scoresById[dapp.id], ratingAverages[dapp.id], dapp.rating))}</span>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          <Vote className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{voteCounts[dapp.id] || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {dapp.website_url && (
                          <a href={dapp.website_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Globe className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                          </a>
                        )}
                        {dapp.twitter && (
                          <a href={`https://twitter.com/${dapp.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Twitter className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                          </a>
                        )}
                        {dapp.discord && (
                          <a href={`https://discord.gg/${dapp.discord}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <FaDiscord className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                          </a>
                        )}
                        {dapp.github && (
                          <a href={`https://github.com/${dapp.github}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Github className="w-2.5 h-2.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
};

export default HotDApps;
