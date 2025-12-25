import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Bell, Globe, Palette, Shield, Trash2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

export default function Settings() {
  const isLocked = true;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    campaigns: true,
    news: true,
    updates: false,
    marketing: false,
  });
  const [analytics, setAnalytics] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    
    const savedLang = localStorage.getItem('language');
    const savedNotif = localStorage.getItem('notifications');
    const savedAnalytics = localStorage.getItem('analytics');
    const savedPublicProfile = localStorage.getItem('publicProfile');
    
    if (savedLang) setLanguage(savedLang);
    if (savedNotif) setNotifications(JSON.parse(savedNotif));
    if (savedAnalytics) setAnalytics(JSON.parse(savedAnalytics));
    if (savedPublicProfile) setPublicProfile(JSON.parse(savedPublicProfile));
  }, []);

  const handleSave = () => {
    
    localStorage.setItem('language', language);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('analytics', JSON.stringify(analytics));
    localStorage.setItem('publicProfile', JSON.stringify(publicProfile));
    
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  const handleClearCache = () => {
    
    const essentialKeys = ['theme', 'language'];
    Object.keys(localStorage).forEach(key => {
      if (!essentialKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    toast({
      title: 'Cache Cleared',
      description: 'Application cache has been cleared.',
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      {}
      {isLocked && (
        <>
          <div className="fixed top-16 left-0 right-0 bottom-16 md:top-20 md:bottom-0 bg-background/80 backdrop-blur-md z-40" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center">
            <div className="flex items-center justify-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Coming Soon</h2>
            </div>
          </div>
        </>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            App Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Customize your Zamaverse experience
          </p>
        </div>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Zamaverse looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language & Region
            </CardTitle>
            <CardDescription>Set your language preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select your preferred language
              </p>
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-campaigns">Campaign Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new campaigns and rewards
                </p>
              </div>
              <Switch
                id="notif-campaigns"
                checked={notifications.campaigns}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, campaigns: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-news">News & Articles</Label>
                <p className="text-sm text-muted-foreground">
                  Stay updated with Web3 news and educational content
                </p>
              </div>
              <Switch
                id="notif-news"
                checked={notifications.news}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, news: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-updates">Platform Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about new features and improvements
                </p>
              </div>
              <Switch
                id="notif-updates"
                checked={notifications.updates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, updates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-marketing">Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Promotional content and special offers
                </p>
              </div>
              <Switch
                id="notif-marketing"
                checked={notifications.marketing}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, marketing: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve Zamaverse by sharing anonymized usage data
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Profile Publicly</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your public profile and activity
                </p>
              </div>
              <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
            </div>

            <Button variant="outline" asChild className="w-full">
              <a href="/privacy">View Privacy Policy</a>
            </Button>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle>Advanced</CardTitle>
            <CardDescription>Advanced settings and data management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleClearCache}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                App Version: 1.0.0
              </p>
              <p className="text-sm text-muted-foreground">
                Built with ❤️ by the Zamaverse team
              </p>
            </div>
          </CardContent>
        </Card>

        {}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
