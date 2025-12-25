import { Star, Vote, ArrowRight, Globe, Twitter, Github, LeafyGreen } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { backend } from "@/services";
import { generateDAppSlug, getDisplayRating, formatRating } from "@/lib/utils";
import uniswapLogo from "@/assets/uniswap-logo.png";
import { useTranslation } from "react-i18next";

const FeaturedDApps = () => {
  const { t } = useTranslation();
  const [featuredDApps, setFeaturedDApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [ratingAverages, setRatingAverages] = useState<Record<string, number>>({});
  const [scoresById, setScoresById] = useState<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeaturedDApps = async () => {
      setLoading(true);
      
      const { data, error } = await backend.dapps.getFeatured(8);
      
      if (!error && data) {
        setFeaturedDApps(data);
        
        const ids = data.map((d) => d.id);
        
        const counts: Record<string, number> = {};
        const sums: Record<string, number> = {};
        const numRatings: Record<string, number> = {};
        
        await Promise.all(ids.map(async (id) => {
          const { data: votes } = await backend.votes.getByDApp(id);
          if (votes) {
            votes.forEach((v: any) => {
              counts[id] = (counts[id] || 0) + (v.vote_amount || 0);
              if (v.rating !== null && v.rating !== undefined) {
                const r = Number(v.rating);
                if (!isNaN(r) && r > 0) {
                  sums[id] = (sums[id] || 0) + r;
                  numRatings[id] = (numRatings[id] || 0) + 1;
                }
              }
            });
          }
        }));
        
        setVoteCounts(counts);
        const avg: Record<string, number> = {};
        Object.keys(sums).forEach((id) => {
          const c = numRatings[id] || 0;
          avg[id] = c > 0 ? sums[id] / c : 0;
        });
        setRatingAverages(avg);

        const map: Record<string, number> = {};
        await Promise.all(ids.map(async (id) => {
          const { data: score } = await backend.scores.getByDApp(id);
          if (score) {
            const v = Number(score.vote_score || 0);
            map[id] = v > 5 ? v / 2 : v;
          }
        }));
        setScoresById(map);
      }
      setLoading(false);
    };

    fetchFeaturedDApps();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && !loading) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [loading, featuredDApps]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LeafyGreen className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">{t('dapps.featured')}</h2>
        </div>
        <Link to="/dapps?sortBy=featured">
          <Button variant="ghost" className="text-primary hover:text-primary/80 -mr-3 hover:bg-transparent">
            {t('dapps.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <>
          {}
          <div className="md:hidden -mx-4">
            <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-4 px-4 snap-x snap-mandatory">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center space-y-0">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <div className="flex items-center space-x-3 py-3">
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
                      {j < 3 && <Separator className="my-0.5" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {}
          <div className="hidden md:grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-lg p-3 border border-border/50">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-2 w-16" />
                      <Skeleton className="h-2 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {}
          <div className="md:hidden -mx-4">
            <div ref={scrollContainerRef} className="flex overflow-x-auto pb-2 scrollbar-hide gap-4 px-4 snap-x snap-mandatory">
              {Array.from({ length: Math.ceil(featuredDApps.slice(0, 9).length / 3) }, (_, pageIndex) => (
            <div key={pageIndex} className="flex-shrink-0 w-[calc(100vw-2rem)] snap-center">
              <div className="space-y-0">
                {featuredDApps.slice(pageIndex * 3, (pageIndex + 1) * 3).map((dapp, index) => (
                  <div key={dapp.id}>
                    <Link to={`/dapp/${generateDAppSlug(dapp.name)}`} className="block">
                      <div className="flex items-center space-x-3 py-3 hover:bg-accent/5 rounded-lg transition-smooth cursor-pointer">
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
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 ml-2 flex-shrink-0">
                              <Star className="w-3 h-3 text-primary fill-current" />
                              <span className="text-[10px] font-medium text-primary">Featured</span>
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
                    </Link>
                    {index < 2 && <Separator className="my-0.5" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {featuredDApps.map((dapp) => (
          <Link key={dapp.id} to={`/dapp/${generateDAppSlug(dapp.name)}`}>
            <div className="gradient-card rounded-lg p-3 card-shadow hover:glow-effect transition-smooth cursor-pointer">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={dapp.logo_url || uniswapLogo}
                    alt={`${dapp.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-1 rounded-lg translate-y-[4%]"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div className="flex items-center space-x-1 mb-1">
                    <h3 className="font-semibold text-sm leading-tight truncate">{dapp.name}</h3>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                      <Star className="w-2.5 h-2.5 text-primary fill-current" />
                      <span className="text-[9px] font-medium text-primary">Featured</span>
                    </div>
                  </div>
                  <p className="text-xs leading-snug text-muted-foreground line-clamp-1 mb-1">
                    {dapp.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-0.5">
                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                         <span className="text-xs">{formatRating(getDisplayRating(scoresById[dapp.id], ratingAverages[dapp.id], dapp.rating))}</span>
                      </div>
                      <div className="flex items-center space-x-0.5">
                        <Vote className="w-3 h-3" />
                        <span className="text-xs">{voteCounts[dapp.id] || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
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
        ))}
      </div>
        </>
      )}
    </section>
  );
};

export default FeaturedDApps;
