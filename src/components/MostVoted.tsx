import { useQuery } from "@tanstack/react-query";
import { backend } from "@/services";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowRight, TrendingUp, Star, Vote, ExternalLink, Globe, Twitter, Github } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel";
import { generateDAppSlug, getDisplayRating, formatRating } from "@/lib/utils";
import { useEffect, useState } from "react";

const MostVoted = () => {
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [ratingAverages, setRatingAverages] = useState<Record<string, number>>({});
  const [scoresById, setScoresById] = useState<Record<string, number>>({});

  const { data: dapps, isLoading } = useQuery({
    queryKey: ["most-voted-dapps"],
    queryFn: async () => {
      const result = await backend.dapps.getAll({ limit: 20 });
      return result.data || [];
    },
  });

  useEffect(() => {
    const fetchVoteData = async () => {
      if (!dapps || dapps.length === 0) return;

      const ids = dapps.map((d: any) => d.id);
      
      const counts: Record<string, number> = {};
      const sums: Record<string, number> = {};
      const numRatings: Record<string, number> = {};

      for (const id of ids) {
        try {
          const votesResult = await backend.votes.getByDApp(id);
          votesResult.data?.forEach((v: any) => {
            counts[id] = (counts[id] || 0) + (v.vote_amount || 0);
            if (v.rating !== null && v.rating !== undefined) {
              const r = Number(v.rating);
              sums[id] = (sums[id] || 0) + r;
              numRatings[id] = (numRatings[id] || 0) + 1;
            }
          });
        } catch (error) {
          console.error('Error fetching votes for dapp:', id, error);
        }
      }

      const avgs: Record<string, number> = {};
      Object.keys(sums).forEach((id) => {
        avgs[id] = sums[id] / numRatings[id];
      });

      const scores: Record<string, number> = {};
      for (const id of ids) {
        try {
          const scoreResult = await backend.scores.getByDApp(id);
          const scoreData = scoreResult.data;
          if (scoreData?.vote_score !== null && scoreData?.vote_score !== undefined) {
            scores[id] = Number(scoreData.vote_score);
          }
        } catch (error) {
          
        }
      }

      setVoteCounts(counts);
      setRatingAverages(avgs);
      setScoresById(scores);
    };

    fetchVoteData();
  }, [dapps]);

  if (isLoading || !dapps) return null;

  const sortedDapps = [...dapps].sort((a: any, b: any) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)).slice(0, 5);
  const rankById: Record<string, number> = Object.fromEntries(sortedDapps.map((d: any, i: number) => [d.id, i + 1]));

  if (sortedDapps.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Most Voted</h2>
        </div>
        <Link to="/dapps?sortBy=voted">
          <Button variant="ghost" className="text-primary hover:text-primary/80 -mr-3 hover:bg-transparent">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {}
      <div className="md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {sortedDapps.map((dapp: any) => (
              <CarouselItem key={dapp.id} className="pl-2 basis-full">
                <Link to={`/dapp/${generateDAppSlug(dapp.name)}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                    <div className="relative aspect-[5/1] overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
                      {dapp.cover_image ? (
                        <img
                          src={dapp.cover_image}
                          alt={`${dapp.name} cover`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ExternalLink className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        {dapp.badge && (
                          <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] leading-none font-semibold ${
                            dapp.badge === 'Featured' ? 'text-primary-foreground bg-gradient-to-r from-primary to-primary/80' :
                            dapp.badge === 'Hot' ? 'text-white bg-gradient-to-r from-orange-500 to-red-500' :
                            dapp.badge === 'Latest' ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500' :
                            'text-white bg-gradient-to-r from-red-500 to-red-600'
                          }`}>
                            {dapp.badge}
                          </span>
                        )}
                        <div className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full bg-background/90 backdrop-blur-sm border border-border/50">
                          <div className="flex items-center space-x-0.5">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            <span className="text-[9px] font-semibold">{formatRating(getDisplayRating(scoresById[dapp.id], ratingAverages[dapp.id], dapp.rating))}</span>
                          </div>
                          <div className="flex items-center space-x-0.5">
                            <Vote className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-semibold text-muted-foreground">{voteCounts[dapp.id] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-3 relative z-20">
                        <div className="w-[53px] h-[53px] sm:w-[57px] sm:h-[57px] rounded-lg sm:rounded-xl overflow-hidden bg-background border-2 border-background shadow-lg flex-shrink-0 -mt-10">
                          {dapp.logo_url ? (
                            <img
                              src={dapp.logo_url}
                              alt={`${dapp.name} logo`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
                              <ExternalLink className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 -mt-1 flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm sm:text-base leading-tight text-foreground truncate">{dapp.name}</h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                            {dapp.website_url && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(dapp.website_url, '_blank'); }}>
                                <Globe className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                            {dapp.twitter && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://twitter.com/${dapp.twitter.replace('@', '')}`, '_blank'); }}>
                                <Twitter className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                            {dapp.discord && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://discord.gg/${dapp.discord}`, '_blank'); }}>
                                <FaDiscord className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                            {dapp.github && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(dapp.github, '_blank'); }}>
                                <Github className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] leading-snug text-muted-foreground line-clamp-2">{dapp.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {}
      <div className="hidden md:block">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {sortedDapps.map((dapp: any) => (
              <CarouselItem key={dapp.id} className="pl-4 basis-1/4">
                <Link to={`/dapp/${generateDAppSlug(dapp.name)}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm h-full">
                    <div className="relative aspect-[5/1] overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
                      {dapp.cover_image ? (
                        <img
                          src={dapp.cover_image}
                          alt={`${dapp.name} cover`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ExternalLink className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                        {dapp.badge && (
                          <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] leading-none font-semibold ${
                            dapp.badge === 'Featured' ? 'text-primary-foreground bg-gradient-to-r from-primary to-primary/80' :
                            dapp.badge === 'Hot' ? 'text-white bg-gradient-to-r from-orange-500 to-red-500' :
                            dapp.badge === 'Latest' ? 'text-white bg-gradient-to-r from-green-500 to-emerald-500' :
                            'text-white bg-gradient-to-r from-red-500 to-red-600'
                          }`}>
                            {dapp.badge}
                          </span>
                        )}
                        <div className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full bg-background/90 backdrop-blur-sm border border-border/50">
                          <div className="flex items-center space-x-0.5">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            <span className="text-[9px] font-semibold">{formatRating(getDisplayRating(scoresById[dapp.id], ratingAverages[dapp.id], dapp.rating))}</span>
                          </div>
                          <div className="flex items-center space-x-0.5">
                            <Vote className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-semibold text-muted-foreground">{voteCounts[dapp.id] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-3 relative z-20">
                        <div className="w-[53px] h-[53px] sm:w-[57px] sm:h-[57px] rounded-lg sm:rounded-xl overflow-hidden bg-background border-2 border-background shadow-lg flex-shrink-0 -mt-10">
                          {dapp.logo_url ? (
                            <img
                              src={dapp.logo_url}
                              alt={`${dapp.name} logo`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
                              <ExternalLink className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 -mt-1 flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm sm:text-base leading-tight text-foreground truncate">{dapp.name}</h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                            {dapp.website_url && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(dapp.website_url, '_blank'); }}>
                                <Globe className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                            {dapp.twitter && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://twitter.com/${dapp.twitter.replace('@', '')}`, '_blank'); }}>
                                <Twitter className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                            {dapp.discord && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://discord.gg/${dapp.discord}`, '_blank'); }}>
                                <FaDiscord className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                            {dapp.github && (
                              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(dapp.github, '_blank'); }}>
                                <Github className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] leading-snug text-muted-foreground line-clamp-2">{dapp.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default MostVoted;