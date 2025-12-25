import { LayoutDashboard, Package, Megaphone, BookOpen, Newspaper, LogOut, Star, FileText, Image, Bell, FileCheck, Smile, Rocket, Shield, Coins, Activity, Trophy } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'DApps', url: '/admin/dapps', icon: Package },
  { title: 'Submissions', url: '/admin/submissions', icon: FileText },
  { title: 'Scores', url: '/admin/scores', icon: Star },
  { title: 'FHE Monitor', url: '/admin/fhe-monitor', icon: Activity },
  { title: 'Campaigns', url: '/admin/campaigns', icon: Megaphone },
  { title: 'Contract Campaigns', url: '/admin/contract-campaigns', icon: Trophy },
  { title: 'Contracts', url: '/admin/contracts', icon: Rocket },
  { title: 'RewardManager', url: '/admin/reward-manager', icon: Coins },
  { title: 'Protocol Operators', url: '/admin/genesis-operators', icon: Shield },
  { title: 'Learn', url: '/admin/learn', icon: BookOpen },
  { title: 'News', url: '/admin/news', icon: Newspaper },
  { title: 'Banners', url: '/admin/banners', icon: Image },
  { title: 'Announcements', url: '/admin/announcements', icon: Bell },
  { title: 'Discussion Attachments', url: '/admin/discussion-attachments', icon: FileCheck },
  { title: 'Emojis', url: '/admin/emojis', icon: Smile },
];

export function AdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Admin Panel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted/50'
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut />
                  <span>Logout</span>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}