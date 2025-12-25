import { useState, useEffect } from "react";
import { Search, Moon, Sun, Globe, Wallet, ChevronDown, Settings, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import SearchModal from "./SearchModal";
import zamaLogo from "@/assets/zama-logo.png";
import { useWallet } from "@/contexts/WalletContext";
import { ProfileAvatar } from "./ProfileAvatar";
import WalletModal from "./WalletModal";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const { isConnected, address, setShowWalletModal } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const languages = [
    { code: "en", name: "English", flag: "EN" },
    { code: "cn", name: "中文", flag: "CN" },
    { code: "fr", name: "Français", flag: "FR" },
    { code: "id", name: "Indonesia", flag: "ID" },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex items-center -space-x-1 md:space-x-0">
          <div 
            className="flex items-center space-x-0.5 md:space-x-0 cursor-pointer md:translate-y-[2.5px]" 
            onClick={() => window.location.href = '/'}
          >
            <img src={zamaLogo} alt="Zapps" className="w-[46px] h-[46px] md:w-[84px] md:h-[84px]" />
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground leading-tight hidden md:block">
                Zapps
              </span>
              <span className="text-[9px] text-muted-foreground font-medium leading-tight hidden md:flex items-center gap-1 max-w-[108px]">
                <Lock className="w-2.5 h-2.5" />
                <span>Confidential Mode</span>
              </span>
            </div>
          </div>
          
          <div className="md:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full h-full p-0 [&>button]:hidden">
                <SearchModal />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <Dialog>
            <DialogTrigger asChild>
              <div className="w-full bg-input rounded-lg px-4 py-2 flex items-center space-x-2 cursor-pointer hover:bg-accent transition-smooth">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('common.searchPlaceholder')}</span>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 [&>button]:hidden">
              <SearchModal />
            </DialogContent>
          </Dialog>
        </div>

        <nav className="hidden md:flex items-center space-x-1">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className={`hover:bg-transparent hover:text-primary ${location.pathname === '/' ? 'text-primary font-semibold' : ''}`}
              onClick={() => navigate('/')}
            >
              {t('nav.discover')}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-transparent hover:text-primary w-6 h-6 -ml-2"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-40 p-1">
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    className="justify-start h-auto py-2 px-2 text-sm hover:bg-accent"
                    onClick={() => navigate('/rewards')}
                  >
                    {t('nav.rewards')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start h-auto py-2 px-2 text-sm hover:bg-accent text-muted-foreground"
                    onClick={() => navigate('/games')}
                  >
                    <span className="flex items-center justify-between w-full">
                      {t('nav.games')}
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start h-auto py-2 px-2 text-sm hover:bg-accent text-muted-foreground"
                    onClick={() => navigate('/stake')}
                  >
                    <span className="flex items-center justify-between w-full">
                      Point
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start h-auto py-2 px-2 text-sm hover:bg-accent"
                    onClick={() => navigate('/analytics')}
                  >
                    Analytics
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start h-auto py-2 px-2 text-sm hover:bg-accent"
                    onClick={() => navigate('/news')}
                  >
                    {t('nav.news')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <Button
            variant="ghost"
            className={`hover:bg-transparent hover:text-primary ${location.pathname === '/dapps' ? 'text-primary font-semibold' : ''}`}
            onClick={() => navigate('/dapps')}
          >
            {t('nav.explore')}
          </Button>
          <Button
            variant="ghost"
            className={`hover:bg-transparent hover:text-primary ${location.pathname === '/campaigns' ? 'text-primary font-semibold' : ''}`}
            onClick={() => navigate('/campaigns')}
          >
            {t('nav.campaign')}
          </Button>
          <Button
            variant="ghost"
            className={`hover:bg-transparent hover:text-primary ${location.pathname === '/learn' ? 'text-primary font-semibold' : ''}`}
            onClick={() => navigate('/learn')}
          >
            {t('nav.learn')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hover:bg-transparent hover:text-primary">
                {t('nav.more')}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/submit-dapp')} className="cursor-pointer">
                {t('nav.submitDApp')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/docs')} className="cursor-pointer">
                {t('nav.docs')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/privacy')} className="cursor-pointer text-muted-foreground">
                <span className="flex items-center justify-between w-full">
                  Privacy & Security
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-muted-foreground">
                <span className="flex items-center justify-between w-full">
                  {t('nav.settings')}
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer text-muted-foreground">
                <span className="flex items-center justify-between w-full">
                  {t('nav.help')}
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-primary focus:bg-transparent active:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-semibold">{t('nav.settings')}</div>
              <div className="h-px bg-border my-1" />
              
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span>{t('header.theme')}</span>
                  <div className="flex items-center gap-1">
                    {isDark ? (
                      <>
                        <Moon className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground">{t('header.darkMode')}</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground">{t('header.lightMode')}</span>
                      </>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
              
              <div className="h-px bg-border my-1" />
              
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('header.language')}</div>
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{lang.name}</span>
                    {i18n.language === lang.code && (
                      <span className="text-primary">✓</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isConnected ? (
            <div className="hidden md:flex">
              <ProfileAvatar />
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="btn-web3 hidden md:flex"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {t('common.connectWallet')}
            </Button>
          )}

          {isConnected ? (
            <div className="md:hidden">
              <ProfileAvatar />
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="md:hidden btn-web3 px-2 py-1.5 h-auto text-xs font-bold hover:bg-transparent focus:bg-transparent active:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:scale-100 rounded-lg"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="w-3.5 h-3.5 -mr-0.5" />
              Connect
            </Button>
          )}
        </div>
      </div>
      
      <WalletModal />
    </header>
  );
};

export default Header;