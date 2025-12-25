import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backend } from "@/services";
import { Banner } from "@/services/types";
import { useNavigate } from "react-router-dom";

const HeroBanner = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const result = await backend.banners.getByType('home');
      setBanners(result.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diffX = startX.current - currentX.current;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diffX = startX.current - currentX.current;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleCTAClick = (link: string | null) => {
    if (!link) return;
    
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative overflow-hidden -mb-8 z-10">
      <div className="relative">
          {}
          <div
            className="flex transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="w-full flex-shrink-0">
                <div 
                  className="relative w-full h-[180px] md:h-[300px] overflow-hidden"
                  style={{
                    backgroundImage: banner.image_url ? `url(${banner.image_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {}
                  <div className="relative h-full flex flex-col items-center justify-center text-center space-y-1 px-4 max-w-4xl mx-auto -mt-6">
                    <h1 className="text-base md:text-xl font-bold leading-tight text-white drop-shadow-lg">
                      {banner.title}
                    </h1>
                    {banner.subtitle && (
                      <p className="text-xs md:text-sm text-white/90 drop-shadow-lg">
                        {banner.subtitle}
                      </p>
                    )}
                    {(banner.cta_text && banner.cta_link) || (banner.cta_text_2 && banner.cta_link_2) ? (
                      <div className="pt-2 flex flex-row gap-2">
                        {banner.cta_text && banner.cta_link && (
                          <Button 
                            className="btn-web3 px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm shadow-lg h-7 md:h-8"
                            onClick={() => handleCTAClick(banner.cta_link)}
                          >
                            {banner.cta_text}
                          </Button>
                        )}
                        {banner.cta_text_2 && banner.cta_link_2 && (
                          <Button 
                            variant="outline"
                            className="px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm shadow-lg bg-white/10 border-white/30 text-white hover:bg-white/20 h-7 md:h-8"
                            onClick={() => handleCTAClick(banner.cta_link_2)}
                          >
                            {banner.cta_text_2}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
          ))}
        </div>

        {}
        {banners.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 z-30 flex justify-center gap-2 bottom-[3.7rem] md:bottom-[3.2rem]">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-6 bg-gradient-to-r from-primary to-primary/80"
                    : "w-1 bg-white/70 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;