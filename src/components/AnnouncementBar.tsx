import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { ChevronUp, AlertTriangle, Info, Newspaper, GraduationCap } from 'lucide-react';
import { backend } from '@/services';
import { Button } from './ui/button';

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: 'warning' | 'update' | 'news' | 'learn';
  display_on_all_pages: boolean;
  display_on_pages: string[] | null;
}

const getPageIdentifier = (pathname: string): string => {
  if (pathname === '/') return 'home';
  if (pathname === '/dapps') return 'dapps';
  if (pathname.startsWith('/dapp/')) return 'dapp-detail';
  if (pathname === '/campaigns') return 'campaigns';
  if (pathname.startsWith('/campaign/')) return 'campaign-detail';
  if (pathname === '/learn') return 'learn';
  if (pathname === '/news') return 'news';
  if (pathname === '/profile') return 'profile';
  return '';
};

const getEntityId = (pathname: string): string | null => {
  const dappMatch = pathname.match(/^\/dapp\/([^/]+)/);
  if (dappMatch) return dappMatch[1];
  
  const campaignMatch = pathname.match(/^\/campaign\/([^/]+)/);
  if (campaignMatch) return campaignMatch[1];
  
  return null;
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'update':
      return <Info className="h-4 w-4" />;
    case 'news':
      return <Newspaper className="h-4 w-4" />;
    case 'learn':
      return <GraduationCap className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getTypeColors = (type: string) => {
  switch (type) {
    case 'warning':
      return {
        bg: 'from-yellow-500/10 via-orange-500/10 to-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-600 dark:text-yellow-400',
        hover: 'hover:bg-yellow-500/20',
      };
    case 'update':
      return {
        bg: 'from-blue-500/10 via-cyan-500/10 to-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:bg-blue-500/20',
      };
    case 'news':
      return {
        bg: 'from-purple-500/10 via-pink-500/10 to-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:bg-purple-500/20',
      };
    case 'learn':
      return {
        bg: 'from-green-500/10 via-emerald-500/10 to-green-500/10',
        border: 'border-green-500/20',
        text: 'text-green-600 dark:text-green-400',
        hover: 'hover:bg-green-500/20',
      };
    default:
      return {
        bg: 'from-gray-500/10 via-slate-500/10 to-gray-500/10',
        border: 'border-gray-500/20',
        text: 'text-gray-600 dark:text-gray-400',
        hover: 'hover:bg-gray-500/20',
      };
  }
};

export function AnnouncementBar() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const currentPage = getPageIdentifier(location.pathname);
  const entityId = getEntityId(location.pathname);

  const { data: announcement } = useQuery({
    queryKey: ['active-announcement', currentPage],
    queryFn: async () => {
      const { data, error } = await backend.announcements.getActive();
      if (error) throw error;
      
      return data?.[0] as Announcement | null;
    },
    refetchInterval: 30000,
  });

  const handleClose = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (announcement) {
      setIsVisible(true);
    }
  }, [announcement?.id]);

  const shouldDisplay = announcement && 
    isVisible &&
    (announcement.display_on_all_pages || 
     (announcement.display_on_pages && (
       announcement.display_on_pages.includes(currentPage) ||
       (entityId && announcement.display_on_pages.includes(`${currentPage}:${entityId}`))
     )));

  if (!shouldDisplay) return null;

  const colors = getTypeColors(announcement.announcement_type);

  return (
    <div 
      className={`fixed top-16 left-0 right-0 z-50 bg-gradient-to-r ${colors.bg} border-b ${colors.border} backdrop-blur-md transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-1.5 gap-4">
          <div className="flex items-center gap-3 flex-1 overflow-hidden min-h-[18px]">
            <div className={`font-bold ${colors.text} flex items-center gap-2 text-xs md:text-sm flex-shrink-0`}>
              {getTypeIcon(announcement.announcement_type)}
              <span>{announcement.title}</span>
            </div>
            <div className="flex-1 overflow-hidden flex items-center">
              <div className="animate-marquee whitespace-nowrap text-xs md:text-sm text-foreground/80 italic">
                {announcement.message}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={`flex-shrink-0 h-6 w-6 p-0 ${colors.hover}`}
            title="Hide announcement"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
