import { ReactNode, useState, useEffect } from "react";
import { ArrowUp, ArrowLeft, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import MobileNavigation from "./MobileNavigation";
import WalletModal from "./WalletModal";
import { AnnouncementBar } from "./AnnouncementBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [bannerClosed, setBannerClosed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailPage = location.pathname.startsWith('/dapp/');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (scrollY <= 10 && bannerClosed) {
        setBannerClosed(false);
      }
      
      const shouldShow = scrollY > 50 && !bannerClosed;
      setShowScrollButtons(shouldShow);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [bannerClosed]);

  useEffect(() => {
    setBannerClosed(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    navigate(-1);
  };

  const closeBanner = () => {
    setBannerClosed(true);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <AnnouncementBar />
      <WalletModal />
      
      {showScrollButtons && isDetailPage && (
        <div className="sticky top-16 z-40 backdrop-blur-md bg-background/20 border-y border-primary/20 animate-fade-in">
          <div className="flex justify-between items-center py-2 md:py-3 px-4">
            <ArrowLeft 
              className="h-4 w-4 md:h-5 md:w-5 text-foreground/70 hover:text-foreground cursor-pointer transition-colors" 
              onClick={goBack}
              aria-label="Go back"
            />
            
            <div className="flex items-center gap-3 md:gap-4">
              <ArrowUp 
                className="h-4 w-4 md:h-5 md:w-5 text-foreground/70 hover:text-foreground cursor-pointer transition-colors" 
                onClick={scrollToTop}
                aria-label="Scroll to top"
              />
              
              <X 
                className="h-4 w-4 md:h-5 md:w-5 text-foreground/70 hover:text-foreground cursor-pointer transition-colors" 
                onClick={closeBanner}
                aria-label="Close banner"
              />
            </div>
          </div>
        </div>
      )}
      
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
};

export default Layout;