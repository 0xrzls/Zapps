import { useEffect, useState } from 'react';
import { backend } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Megaphone, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDapps: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    featuredDapps: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [dappsRes, campaignsRes, activeCampaignsRes, featuredRes] = await Promise.all([
        backend.dapps.getAll(),
        backend.campaigns.getAll(),
        backend.campaigns.getActive(),
        backend.dapps.getFeatured(),
      ]);

      setStats({
        totalDapps: dappsRes.data?.length || 0,
        totalCampaigns: campaignsRes.data?.length || 0,
        activeCampaigns: activeCampaignsRes.data?.length || 0,
        featuredDapps: featuredRes.data?.length || 0,
      });
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total DApps', value: stats.totalDapps, icon: Package, color: 'text-primary' },
    { title: 'Total Campaigns', value: stats.totalCampaigns, icon: Megaphone, color: 'text-accent' },
    { title: 'Active Campaigns', value: stats.activeCampaigns, icon: TrendingUp, color: 'text-green-500' },
    { title: 'Featured DApps', value: stats.featuredDapps, icon: Users, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Overview platform statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border bg-card hover:shadow-glow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}