import { useEffect, useState } from "react";
import { backend } from "@/services";
import { News as NewsType } from "@/services/types";
import { Calendar, User, Tag, Newspaper, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const News = () => {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const result = await backend.news.getAll();
        setNews(result.data || []);
      } catch (error) {
        console.error('Error fetching news:', error);
        toast({
          title: "Error",
          description: "Failed to load news",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    fetchNews();
  }, [toast]);

  const categories = ["all", ...Array.from(new Set(news.map(n => n.category).filter(Boolean)))];
  
  const filteredNews = selectedCategory === "all" 
    ? news 
    : news.filter(n => n.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6">
      {}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 p-4 md:p-6">
        {}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center backdrop-blur-sm">
            <Newspaper className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              {t('news.newsHub')}
              <Sparkles className="w-4 h-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">{t('news.latestUpdates')}</p>
          </div>
        </div>
      </div>

      {}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`snap-start px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-card/50 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary backdrop-blur-sm"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {}
      {loading ? (
        <>
          {}
          <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 w-max">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-[280px] bg-card/50 border border-border/50 rounded-xl p-3 animate-pulse">
                  <div className="h-32 bg-accent/20 rounded-lg mb-3" />
                  <div className="h-4 bg-accent/20 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-accent/20 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
          {}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-4 animate-pulse">
                <div className="h-36 bg-accent/20 rounded-lg mb-3" />
                <div className="h-4 bg-accent/20 rounded mb-2 w-3/4" />
                <div className="h-3 bg-accent/20 rounded w-full" />
              </div>
            ))}
          </div>
        </>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">{t('news.noNews')}</p>
        </div>
      ) : (
        <>
          {}
          <div className="md:hidden overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 w-max">
              {filteredNews.map((item) => (
                <div 
                  key={item.id} 
                  className="snap-start group w-[280px] border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-smooth bg-card/50 backdrop-blur-sm"
                >
                  {}
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-primary/60" />
                      </div>
                    )}
                    {item.category && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 text-primary-foreground text-[10px] font-medium rounded-full backdrop-blur-sm">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {}
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-smooth">
                      {item.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.summary || item.content}
                    </p>

                    <div className="h-px bg-border/50" />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate">
                          {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        {t('common.read')}
                      </Button>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {item.tags.slice(0, 2).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded-full whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.map((item) => (
              <div 
                key={item.id} 
                className="group border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-smooth hover:shadow-lg bg-card/50 backdrop-blur-sm"
              >
                {}
                <div className="relative h-36 bg-gradient-to-br from-primary/20 to-primary/5">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-primary/60" />
                    </div>
                  )}
                  {item.category && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 text-primary-foreground text-[10px] font-medium rounded-full backdrop-blur-sm">
                      {item.category}
                    </span>
                  )}
                </div>

                {}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-smooth">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.summary || item.content}
                  </p>

                  <div className="h-px bg-border/50" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      
                      {item.author && (
                        <>
                          <span className="text-border">•</span>
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{item.author}</span>
                        </>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-3 text-xs hover:bg-primary/10 hover:text-primary"
                    >
                      {t('common.read')}
                    </Button>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default News;