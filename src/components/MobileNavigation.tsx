import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Blocks, Trophy, GraduationCap, MoreHorizontal } from "lucide-react";
import MoreDrawer from "./MoreDrawer";
import { useTranslation } from "react-i18next";

const MobileNavigation = () => {
  const { t } = useTranslation();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: t('nav.home'), isLink: true, locked: false },
    { path: "/dapps", icon: Blocks, label: t('nav.dapps'), isLink: true, locked: false },
    { path: "/campaigns", icon: Trophy, label: t('nav.campaign'), isLink: true, locked: false },
    { path: "/learn", icon: GraduationCap, label: t('nav.learn'), isLink: true, locked: false },
    { path: "/more", icon: MoreHorizontal, label: t('nav.more'), isLink: false, locked: false },
  ];

  const handleMoreClick = () => {
    setShowMoreDrawer(true);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label, isLink, locked }) => 
            isLink ? (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 min-w-0 text-xs transition-smooth relative ${
                    locked 
                      ? "text-muted-foreground/50 opacity-60"
                      : isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="truncate">{label}</span>
                {locked && (
                  <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[9px] px-1 py-0.5 rounded-full font-bold leading-none">
                    {t('home.soon')}
                  </span>
                )}
              </NavLink>
            ) : (
              <button
                key={path}
                onClick={handleMoreClick}
                className={`flex flex-col items-center py-2 px-3 min-w-0 text-xs transition-smooth ${
                  location.pathname === path
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="truncate">{label}</span>
              </button>
            )
          )}
        </div>
      </nav>
      
      <MoreDrawer open={showMoreDrawer} onOpenChange={setShowMoreDrawer} />
    </>
  );
};

export default MobileNavigation;