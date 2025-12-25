import { BookOpen, Play, FileText, Clock, User, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { backend } from "@/services";

interface LearnContentProps {
  type: "guides" | "articles" | "videos";
}

const LearnContent = ({ type }: LearnContentProps) => {
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      const contentTypeMap = {
        guides: 'guide',
        articles: 'article',
        videos: 'video'
      };

      const { data, error } = await backend.learn.getByType(contentTypeMap[type], { orderBy: 'created_at', ascending: false });
      
      if (!error && data) {
        setContent(data);
      }
    };

    fetchContent();
  }, [type]);

  const getIcon = () => {
    switch (type) {
      case "guides":
        return BookOpen;
      case "articles":
        return FileText;
      case "videos":
        return Play;
      default:
        return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const Icon = getIcon();

  return (
    <>
      {}
      <div className="md:hidden overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 w-max">
          {content.map((item: any) => (
            <div 
              key={item.id} 
              className="snap-start group w-[280px] border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-smooth bg-card/50 backdrop-blur-sm"
            >
              {}
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-10 h-10 text-primary/60" />
                  </div>
                )}
                {type === "videos" && item.duration && (
                  <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-medium">
                    {item.duration}
                  </div>
                )}
                {type === "guides" && item.difficulty && (
                  <span className={`absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getDifficultyColor(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                )}
              </div>

              {}
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-smooth">
                  {item.title}
                </h3>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>

                <div className="h-px bg-border/50" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{item.author}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                    onClick={() => item.content_url && window.open(item.content_url, '_blank')}
                  >
                    {type === "videos" ? (
                      <Play className="w-3 h-3" />
                    ) : (
                      <BookOpen className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map((item: any) => (
          <div 
            key={item.id} 
            className="group border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-smooth hover:shadow-lg bg-card/50 backdrop-blur-sm"
          >
            {}
            <div className="relative h-36 bg-gradient-to-br from-primary/20 to-primary/5">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-12 h-12 text-primary/60" />
                </div>
              )}
              {type === "videos" && item.duration && (
                <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-medium">
                  {item.duration}
                </div>
              )}
              {type === "guides" && item.difficulty && (
                <span className={`absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getDifficultyColor(item.difficulty)}`}>
                  {item.difficulty}
                </span>
              )}
            </div>

            {}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-smooth">
                {item.title}
              </h3>
              
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span className="truncate">{item.author}</span>
                  
                  {(type === "guides" || type === "articles") && item.read_time && (
                    <>
                      <span className="text-border">•</span>
                      <Clock className="w-3 h-3" />
                      <span>{item.read_time}</span>
                    </>
                  )}

                  {type === "videos" && item.views && (
                    <>
                      <span className="text-border">•</span>
                      <Eye className="w-3 h-3" />
                      <span>{item.views}</span>
                    </>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-3 text-xs hover:bg-primary/10 hover:text-primary"
                  onClick={() => item.content_url && window.open(item.content_url, '_blank')}
                >
                  {type === "videos" ? (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Watch
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Read
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default LearnContent;
