import { useEffect, useState } from "react";
import { backend } from "@/services";
import { Calendar, Twitter, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Update {
  id: string;
  title: string;
  content: string;
  source: 'twitter' | 'news';
  published_at: string;
  author?: string;
  url?: string;
  media?: {
    type: string;
    url?: string;
    preview_image_url?: string;
  }[];
}

interface UpdatesSectionProps {
  dappName: string;
  dappTwitter: string | null;
}

const UpdatesSection = ({ dappName, dappTwitter }: UpdatesSectionProps) => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      
      let newsData: any[] = [];
      try {
        const result = await backend.news.getAll();
        newsData = result.data?.filter((n: any) => 
          n.title?.toLowerCase().includes(dappName.toLowerCase())
        ).slice(0, 10) || [];
      } catch (error) {
        console.error('Error fetching news:', error);
      }

      const allUpdates: Update[] = [];
      
      if (newsData) {
        newsData.forEach(news => {
          allUpdates.push({
            id: news.id,
            title: news.title,
            content: news.summary || news.content,
            source: 'news',
            published_at: news.published_at,
            author: news.author || undefined
          });
        });
      }

      if (dappTwitter) {
        try {
          const username = dappTwitter.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '');
          const { data: twitterResult, error: twitterError } = await backend.functions.invoke('fetch-tweets', {
            body: { username }
          });

          const twitterData = twitterResult;
          
          if (twitterError) {
            console.error('Error fetching tweets:', twitterError);
          } else if (twitterData?.data) {
            const mediaMap = new Map();
            
            if (twitterData.includes?.media) {
              twitterData.includes.media.forEach((media: any) => {
                mediaMap.set(media.media_key, media);
              });
            }
            
            twitterData.data.forEach((tweet: any) => {
              const tweetMedia: any[] = [];
              if (tweet.attachments?.media_keys) {
                tweet.attachments.media_keys.forEach((key: string) => {
                  const media = mediaMap.get(key);
                  if (media) {
                    tweetMedia.push({
                      type: media.type,
                      url: media.url || media.preview_image_url,
                      preview_image_url: media.preview_image_url
                    });
                  }
                });
              }
              
              allUpdates.push({
                id: tweet.id,
                title: `@${username}`,
                content: tweet.text,
                source: 'twitter',
                published_at: tweet.created_at,
                author: username,
                url: `https://twitter.com/${username}/status/${tweet.id}`,
                media: tweetMedia.length > 0 ? tweetMedia : undefined
              });
            });
          }
        } catch (error) {
          console.error('Error fetching Twitter data:', error);
        }
      }

      allUpdates.sort((a, b) => 
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );

      setUpdates(allUpdates);
      setLoading(false);
    };

    fetchUpdates();
  }, [dappName, dappTwitter, toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
            <div className="h-5 bg-accent/20 rounded mb-2 w-3/4" />
            <div className="h-4 bg-accent/20 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-12 border border-border rounded-lg">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">No Updates Yet</h3>
        <p className="text-sm text-muted-foreground">
          Check back later for the latest news and updates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Latest Updates</h2>
      
      {updates.map((update) => (
        <a 
          key={update.id} 
          href={update.url || '#'}
          target={update.url ? "_blank" : undefined}
          rel={update.url ? "noopener noreferrer" : undefined}
          className="block p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {update.source === 'twitter' ? (
                <Twitter className="w-4 h-4 text-blue-500" />
              ) : (
                <Newspaper className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-medium text-sm">{update.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {update.content}
              </p>
              {update.media && update.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {update.media.slice(0, 2).map((media, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-border">
                      <img 
                        src={media.url || media.preview_image_url} 
                        alt="Tweet media"
                        className="w-full h-24 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(update.published_at), { addSuffix: true })}
                </div>
                {update.author && (
                  <div>by {update.author}</div>
                )}
                <div className="px-2 py-0.5 rounded-full bg-accent/20 text-xs">
                  {update.source === 'twitter' ? 'Twitter' : 'News'}
                </div>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default UpdatesSection;