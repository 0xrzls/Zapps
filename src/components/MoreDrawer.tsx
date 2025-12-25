import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "next-themes";
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  requestNotificationPermission,
  isSubscribed 
} from "@/lib/pushNotifications";
import { 
  Globe, 
  Palette, 
  HelpCircle, 
  Plus, 
  Edit3,
  Settings,
  Shield,
  Bell,
  ChevronRight,
  Gamepad2,
  BarChart3,
  Newspaper,
  Gift,
  Coins,
  FileText,
  Github
} from "lucide-react";
import { FaXTwitter, FaDiscord } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MoreDrawer = ({ open, onOpenChange }: MoreDrawerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, setShowWalletModal, address } = useWallet();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");
  const [notifications, setNotifications] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    
    const checkSubscription = async () => {
      if (isConnected) {
        const subscribed = await isSubscribed();
        setNotifications(subscribed);
      }
      setIsCheckingSubscription(false);
    };
    checkSubscription();
  }, [isConnected]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    
    if (!isConnected) {
      toast({
        title: "Connect Wallet Required",
        description: "Please connect your wallet to enable notifications.",
        variant: "destructive",
      });
      setShowWalletModal(true);
      return;
    }

    if (enabled) {
      
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser settings.",
          variant: "destructive",
        });
        return;
      }

      if (!address) {
        toast({
          title: "Wallet Address Not Found",
          description: "Please reconnect your wallet.",
          variant: "destructive",
        });
        return;
      }

      const subscribed = await subscribeToPushNotifications(address);
      if (subscribed) {
        setNotifications(true);
        toast({
          title: "Notifications Enabled",
          description: "You will now receive updates about new dApps, news, and articles!",
        });
      } else {
        toast({
          title: "Subscription Failed",
          description: "Could not enable notifications. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      
      const unsubscribed = await unsubscribeFromPushNotifications();
      if (unsubscribed) {
        setNotifications(false);
        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive push notifications.",
        });
      }
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast({
      title: "Theme Changed",
      description: `Switched to ${theme === "dark" ? "light" : "dark"} mode`,
    });
  };

  const getThemeLabel = () => {
    if (!mounted) return "Loading...";
    return theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";
  };

  const quickMenuItems = [
    {
      icon: FileText,
      title: "Docs",
      path: "/docs",
      external: false,
      comingSoon: false,
    },
    {
      icon: Shield,
      title: "Confidentiality",
      path: "/privacy",
      comingSoon: true,
    },
    {
      icon: Settings,
      title: "FHE Settings",
      path: "/settings",
      comingSoon: true,
    },
    {
      icon: HelpCircle,
      title: t('drawer.helpSupport'),
      path: "/help",
      comingSoon: true,
    },
  ];

  const settingsItems = [
    {
      icon: Globe,
      title: t('drawer.language'),
      subtitle: language === "en" ? "English" : language === "id" ? "Bahasa" : language === "cn" ? "中文" : "Français",
      action: () => {
        const langs = ["en", "id", "cn", "fr"];
        const currentIndex = langs.indexOf(language);
        const newLang = langs[(currentIndex + 1) % langs.length];
        setLanguage(newLang);
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        toast({
          title: t('header.language'),
          description: `Switched to ${newLang === "en" ? "English" : newLang === "id" ? "Bahasa" : newLang === "cn" ? "中文" : "Français"}`,
        });
      },
    },
    {
      icon: Palette,
      title: t('drawer.theme'),
      subtitle: getThemeLabel(),
      action: handleThemeToggle,
    },
    {
      icon: Bell,
      title: t('drawer.notifications'),
      subtitle: t('drawer.pushNotifications'),
      hasToggle: true,
      toggleValue: notifications,
      onToggle: setNotifications,
    },
  ];

  const contributionItems = [
    {
      icon: Plus,
      title: t('drawer.submitDApp'),
      subtitle: t('drawer.submitDAppDesc'),
      className: "btn-web3",
      path: "/submit-dapp",
      comingSoon: false,
    },
    {
      icon: Edit3,
      title: t('drawer.updateDApp'),
      subtitle: t('drawer.updateDAppDesc'),
      className: "border-primary text-primary hover:bg-primary/10",
      path: "/submit-dapp",
      comingSoon: true,
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>{t('drawer.more')}</DrawerTitle>
          <DrawerDescription>
            {t('drawer.settingsHelpOptions')}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 pb-8 space-y-6 overflow-y-auto">
          {}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('drawer.contribute')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {contributionItems.map((item) => (
                <Button
                  key={item.title}
                  variant="outline"
                  className={`justify-start h-auto p-3 relative ${item.className} ${
                    item.comingSoon ? "text-muted-foreground/50 opacity-60" : ""
                  }`}
                  onClick={() => handleNavigation(item.path)}
                  disabled={item.comingSoon}
                >
                  <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                  </div>
                  {item.comingSoon && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded-full font-bold leading-none">
                      {t('home.soon')}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('drawer.quickMenu')}</h2>
            <div className="grid grid-cols-4 gap-2">
              {quickMenuItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    if (item.external) {
                      window.open(item.path, '_blank');
                      onOpenChange(false);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-smooth relative ${
                    item.comingSoon ? "text-muted-foreground/50 opacity-60" : ""
                  }`}
                  disabled={item.comingSoon}
                >
                  <item.icon className={`w-5 h-5 mb-2 ${item.comingSoon ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
                  <span className="text-[10px] font-medium text-center leading-tight">
                    {item.title.length > 8 ? `${item.title.substring(0, 8)}...` : item.title}
                  </span>
                  {item.comingSoon && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded-full font-bold leading-none">
                        {t('home.soon')}
                      </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('drawer.settings')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {settingsItems.slice(0, 2).map((item) => (
                <button
                  key={item.title}
                  className="flex items-center justify-start gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-smooth"
                  onClick={item.action}
                >
                  <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-xs truncate">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
            
            {}
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{t('drawer.notifications')}</div>
                    <div className="text-xs text-muted-foreground">{t('drawer.pushNotifications')}</div>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={handleNotificationToggle}
                  disabled={isCheckingSubscription}
                />
              </div>
            </div>
          </div>

          {}
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-sm font-semibold text-foreground">Zapps</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Building the future of confidential on-chain discovery, powered by Zama FHE.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://twitter.com/zapps" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-smooth">
                <FaXTwitter className="w-4 h-4" />
              </a>
              <a href="https://discord.gg/zapps" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-smooth">
                <FaDiscord className="w-4 h-4" />
              </a>
              <a href="https://github.com/zapps" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-smooth">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://docs.zapps.fun" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-smooth">
                <FileText className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MoreDrawer;