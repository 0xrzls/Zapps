import { useState, useMemo, useEffect } from "react";
import { Search, TrendingUp, Clock, ExternalLink, Trophy, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { backend } from "@/services";
import { DApp, Campaign } from "@/services/types";
import { generateDAppSlug } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface SearchInteraction {
  type: 'dapp' | 'campaign';
  id: string;
  name: string;
  count: number;
}

const SearchModal = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularItems, setPopularItems] = useState<SearchInteraction[]>([]);
  const [dapps, setDapps] = useState<DApp[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dappsResult, campaignsResult] = await Promise.all([
          backend.dapps.getAll(),
          backend.campaigns.getAll()
        ]);

        setDapps(dappsResult.data || []);
        setCampaigns(campaignsResult.data || []);
      } catch (error) {
        console.error('Error fetching search data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const storedRecent = localStorage.getItem('recentSearches');
    const storedPopular = localStorage.getItem('popularSearchItems');
    
    if (storedRecent) {
      setRecentSearches(JSON.parse(storedRecent));
    }
    
    if (storedPopular) {
      setPopularItems(JSON.parse(storedPopular));
    }
  }, []);

  const saveSearchQuery = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const trackItemClick = (type: 'dapp' | 'campaign', id: string, name: string) => {
    const existing = popularItems.find(item => item.type === type && item.id === id);
    let updated: SearchInteraction[];
    
    if (existing) {
      updated = popularItems.map(item => 
        item.type === type && item.id === id 
          ? { ...item, count: item.count + 1 }
          : item
      );
    } else {
      updated = [...popularItems, { type, id, name, count: 1 }];
    }
    
    updated = updated.sort((a, b) => b.count - a.count).slice(0, 10);
    setPopularItems(updated);
    localStorage.setItem('popularSearchItems', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const popularSearches = popularItems.slice(0, 5).map(item => item.name);

  const searchResults = useMemo(() => {
    if (!query.trim()) return { dapps: [], campaigns: [] };
    
    const lowercaseQuery = query.toLowerCase();
    
    const filteredDapps = dapps.filter(dapp =>
      dapp.name.toLowerCase().includes(lowercaseQuery) ||
      dapp.description.toLowerCase().includes(lowercaseQuery) ||
      (dapp.category && dapp.category.toLowerCase().includes(lowercaseQuery)) ||
      (dapp.tags && dapp.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
    
    const filteredCampaigns = campaigns.filter(campaign =>
      campaign.title.toLowerCase().includes(lowercaseQuery) ||
      campaign.description.toLowerCase().includes(lowercaseQuery) ||
      (campaign.category && campaign.category.toLowerCase().includes(lowercaseQuery))
    );
    
    return { dapps: filteredDapps, campaigns: filteredCampaigns };
  }, [query, dapps, campaigns]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveSearchQuery(searchQuery.trim());
    }
  };

  const handleDAppClick = (dapp: DApp) => {
    trackItemClick('dapp', dapp.id, dapp.name);
    handleSearch(query);
    const slug = generateDAppSlug(dapp.name);
    navigate(`/dapp/${slug}?id=${dapp.id}`);
  };

  const handleCampaignClick = (campaign: Campaign) => {
    trackItemClick('campaign', campaign.id, campaign.title);
    handleSearch(query);
    navigate(`/campaign/${campaign.id}`);
  };

  const hasResults = searchResults.dapps.length > 0 || searchResults.campaigns.length > 0;

  return (
    <div className="w-full max-h-[calc(100vh-8rem)] overflow-hidden">
      {}
      <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={t('common.searchPlaceholder')}
          className="flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
          autoFocus
        />
        <DialogClose asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            {t('common.cancel')}
          </Button>
        </DialogClose>
      </div>

      {}
      <div className="bg-glassmorphic border-none rounded-none px-4 py-4 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">

      {}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>{t('common.loading')}</p>
        </div>
      )}

      {}
      {!loading && query.trim() && (
        <div className="space-y-4">
          {hasResults ? (
            <>
              {}
              {searchResults.dapps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                    <span>{t('search.dapps')}</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.dapps.map((dapp) => (
                      <DialogClose asChild key={dapp.id}>
                        <button
                          onClick={() => handleDAppClick(dapp)}
                          className="w-full text-left p-3 bg-card/50 backdrop-blur-sm border border-border/30 rounded-lg hover:bg-card/70 hover:border-primary/20 transition-smooth"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{dapp.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{dapp.description}</p>
                            </div>
                            <span className="badge-category ml-2 flex-shrink-0">
                              {dapp.category}
                            </span>
                          </div>
                        </button>
                      </DialogClose>
                    ))}
                  </div>
                </div>
              )}

              {}
              {searchResults.campaigns.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Trophy className="w-4 h-4" />
                    <span>{t('search.campaigns')}</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.campaigns.map((campaign) => (
                      <DialogClose asChild key={campaign.id}>
                        <button
                          onClick={() => handleCampaignClick(campaign)}
                          className="w-full text-left p-3 bg-card/50 backdrop-blur-sm border border-border/30 rounded-lg hover:bg-card/70 hover:border-primary/20 transition-smooth"
                        >
                             <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{campaign.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{campaign.description}</p>
                            </div>
                            {campaign.category && (
                              <span className="badge-category ml-2 flex-shrink-0">
                                {campaign.category}
                              </span>
                            )}
                          </div>
                        </button>
                      </DialogClose>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('search.noResultsFor')} "{query}"</p>
            </div>
          )}
        </div>
      )}

      {}
      {!loading && !query.trim() && (
        <>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>{t('search.popular')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1 bg-accent/50 backdrop-blur-sm text-accent-foreground rounded-lg text-sm hover:bg-accent/70 transition-smooth border border-border/20"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {}
          {recentSearches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{t('search.recent')}</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {t('search.clear')}
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={`${term}-${index}`}
                    onClick={() => setQuery(term)}
                    className="block w-full text-left px-3 py-2 bg-card/30 backdrop-blur-sm hover:bg-card/50 rounded-lg transition-smooth border border-border/20"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default SearchModal;
