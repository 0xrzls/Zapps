import { Star, Vote, ExternalLink, Globe, Twitter, Github } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { backend } from "@/services";
import { generateDAppSlug, formatRating } from "@/lib/utils";
import uniswapLogo from "@/assets/uniswap-logo.png";

interface DAppsListProps {
  category: string;
  viewType: "list" | "grid";
  searchQuery?: string;
  sortBy?: string;
}

const DAppsList = ({ category, viewType, searchQuery = "", sortBy = "all" }: DAppsListProps) => {
  const [dapps, setDapps] = useState<any[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [scoresById, setScoresById] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchDApps = async () => {
      try {
        
        const options: any = {};
        
        if (sortBy === "featured") {
          options.filter = { is_featured: true };
        } else if (sortBy === "latest") {
          options.orderBy = 'created_at';
          options.ascending = false;
          options.limit = 20;
        } else if (sortBy === "alphabetical") {
          options.orderBy = 'name';
          options.ascending = true;
        }
        
        console.log('[DAppsList] Fetching dApps...');
        const { data: allDapps, error } = await backend.dapps.getAll(options);
        
        if (error) {
          console.error('[DAppsList] Error:', error);
          return;
        }
        
        let data = allDapps || [];
        
        if (category !== "All") {
          const categoryMap: Record<string, string> = {
            'Protocol Operator': 'Protocol Operator',
            'DeFi': 'defi',
            'NFT': 'nft',
            'Gaming': 'gaming',
            'Social': 'social',
            'Infrastructure': 'infrastructure'
          };
          const dbCategory = categoryMap[category] || category.toLowerCase().replace(/ /g, '_');
          data = data.filter(d => d.category === dbCategory);
        }
        
        console.log('[DAppsList] Fetched:', data.length, 'items');
        
        setDapps(data);
        
        const ids = data.map((d) => d.id);
        const scorePromises = ids.map(id => backend.scores.getByDApp(id).catch(() => ({ data: null })));
        const scoreResults = await Promise.all(scorePromises);
        
        const scoreMap: Record<string, number> = {};
        const voteCountMap: Record<string, number> = {};
        
        scoreResults.forEach((result, index) => {
          const id = ids[index];
          if (result.data) {
            const voteScore = Number(result.data.vote_score || 0);
            scoreMap[id] = voteScore > 5 ? voteScore / 2 : voteScore;
          }
          
          try {
            const cached = localStorage.getItem(`fhe_rating_${id}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.voteCount && parsed.voteCount > 0) {
                voteCountMap[id] = parsed.voteCount;
              }
              if (parsed.average && parsed.average > 0) {
                const cachedAvg = parsed.average > 5 ? parsed.average / 2 : parsed.average;
                if (cachedAvg > (scoreMap[id] || 0)) {
                  scoreMap[id] = cachedAvg;
                }
              }
            }
          } catch {}
        });
        
        setScoresById(scoreMap);
        setVoteCounts(voteCountMap);
        
        let sortedData = [...data];
        if (sortBy === "voted") {
          sortedData.sort((a, b) => (voteCountMap[b.id] || 0) - (voteCountMap[a.id] || 0));
        } else if (sortBy === "hot") {
          sortedData.sort((a, b) => {
            const aScore = (scoreMap[a.id] || 0) + (new Date(a.created_at).getTime() / 1000000000);
            const bScore = (scoreMap[b.id] || 0) + (new Date(b.created_at).getTime() / 1000000000);
            return bScore - aScore;
          });
        }
        
        if (sortBy === "voted" || sortBy === "hot") {
          setDapps(sortedData);
        }
      } catch (err) {
        console.error('[DAppsList] Unexpected error:', err);
      }
    };

    fetchDApps();
  }, [category, sortBy]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('fhe_rating_')) {
        try {
          const id = e.key.replace('fhe_rating_', '');
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          if (parsed && typeof parsed.voteCount === 'number') {
            setVoteCounts((prev) => ({ ...prev, [id]: parsed.voteCount }));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filteredDapps = dapps.filter((dapp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return dapp.name?.toLowerCase().includes(query);
  });

  const GridLayout = () => (
    <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 md:grid-cols-4 -mx-4 sm:-mx-6">
      {filteredDapps.map((dapp, index) => (
        <div key={dapp.id} className="relative">
          <Link to={`/dapp/${generateDAppSlug(dapp.name)}`} className="block">
            <div className="px-4 sm:px-6 py-3 hover:bg-accent/5 transition-all duration-300 group">
              {}
              <div className="w-full aspect-[20/3] rounded-t-xl overflow-hidden relative">
                {dapp.cover_image ? (
                  <img
                    src={dapp.cover_image}
                    alt={`${dapp.name} banner`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20"></div>
                )}
                
                {}
                <div className="absolute top-2 right-2 z-10">
                  <span className="badge-category text-[9px]">{dapp.category}</span>
                </div>
                
                {}
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
                  <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 border border-border/50">
                    <div className="flex items-center space-x-0.5">
                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                      <span className="text-xs font-medium">{formatRating(scoresById[dapp.id] || dapp.rating || 0)}</span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      <Vote className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{voteCounts[dapp.id] || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 px-4 mb-3 sm:mb-4 relative z-20">
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-lg sm:rounded-xl overflow-hidden bg-background border-2 border-background shadow-lg flex-shrink-0 -mt-6 sm:-mt-8">
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
                <div className="flex-1 min-w-0 -mt-1 sm:-mt-2 flex items-center justify-between gap-2">
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
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://github.com/${dapp.github}`, '_blank'); }}>
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
          </Link>
          {}
          {index < filteredDapps.length - 4 && (
            <div className="hidden md:block absolute bottom-0 left-4 sm:left-6 right-4 sm:right-6 h-px bg-border/30"></div>
          )}
        </div>
      ))}
    </div>
  );

  const ListLayout = () => (
    <div className="space-y-0">
      {filteredDapps.map((dapp, index) => (
        <div key={dapp.id}>
          <Link to={`/dapp/${generateDAppSlug(dapp.name)}`} className="block">
            <div className="flex items-center space-x-3 py-3 hover:bg-accent/5 rounded-lg transition-smooth cursor-pointer">
              <div className="w-[69px] h-[69px] rounded-2xl overflow-hidden flex-shrink-0">
                {dapp.logo_url ? (
                  <img
                    src={dapp.logo_url}
                    alt={`${dapp.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-1.5 rounded-xl translate-y-[4%]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-xl">
                    <ExternalLink className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm leading-tight text-foreground truncate">{dapp.name}</h3>
                  <span className="badge-category text-[10px] ml-2 flex-shrink-0">{dapp.category}</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground truncate mb-2">{dapp.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                      <span className="text-xs font-medium">{formatRating(scoresById[dapp.id] || dapp.rating || 0)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Vote className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{voteCounts[dapp.id] || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
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
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://github.com/${dapp.github}`, '_blank'); }}>
                        <Github className="w-3 h-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
          {index < filteredDapps.length - 1 && <Separator className="my-0.5" />}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {viewType === "grid" ? <GridLayout /> : <ListLayout />}

      {}
      {filteredDapps.length === 0 && (
        <div className="text-center py-12 sm:py-16 space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {searchQuery ? "No results found" : "No dApps found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery 
                ? `No dApps match "${searchQuery}". Try a different search term.`
                : "There are no dApps in this category yet."
              }
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DAppsList;
