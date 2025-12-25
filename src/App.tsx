import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/AdminLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Campaigns from "./pages/Campaigns";
import DAppsDirectory from "./pages/DAppsDirectory";
import DAppDetail from "./pages/DAppDetail";
import CampaignDetail from "./pages/CampaignDetail";
import Learn from "./pages/Learn";
import News from "./pages/News";
import Rewards from "./pages/Rewards";
import Analytics from "./pages/Analytics";
import ComingSoon from "./pages/ComingSoon";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import OAuthCallback from "./pages/OAuthCallback";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDApps from "./pages/admin/DApps";
import AdminScores from "./pages/admin/Scores";
import AdminFHEMonitor from "./pages/admin/FHEMonitor";
import AdminCampaigns from "./pages/admin/Campaigns";
import AdminContractCampaigns from "./pages/admin/ContractCampaigns";
import AdminContracts from "./pages/admin/Contracts";
import AdminRewardManager from "./pages/admin/RewardManager";
import AdminLearn from "./pages/admin/Learn";
import AdminNews from "./pages/admin/News";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminBanners from "./pages/admin/Banners";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminDiscussionAttachments from "./pages/admin/DiscussionAttachments";
import AdminEmojis from "./pages/admin/Emojis";
import GenesisOperatorsAdmin from "./pages/admin/GenesisOperators";
import GenesisOperatorsPage from "./pages/GenesisOperators";
import SubmitDApp from "./pages/SubmitDApp";
import Docs from "./pages/Docs";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Settings from "./pages/Settings";
import Social from "./pages/Social";
import Governance from "./pages/Governance";
import Leaderboard from "./pages/Leaderboard";
import FHEDebug from "./pages/FHEDebug";

import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { RebrandNotice } from "./components/RebrandNotice";

const queryClient = new QueryClient();

const App = () => {
  const host = window.location.hostname.toLowerCase();
  const isLocalDev = host === 'localhost' || host === '127.0.0.1';
  const isDocsSubdomain = host === 'docs.zapps.fun';
  const isAppSubdomain = host === 'app.zapps.fun';
  const isMainDomain = (host === 'zapps.fun' || host === 'www.zapps.fun');
  
  const isOldLandingDomain = (host === 'zamaverse.xyz' || host === 'www.zamaverse.xyz');
  const isOldAppDomain = host === 'app.zamaverse.xyz';
  
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <WalletProvider>
            <BrowserRouter>
            <Routes>
            {isOldLandingDomain && (
              <Route path="*" element={<RebrandNotice isLandingPage={true} />} />
            )}
            {isOldAppDomain && (
              <Route path="*" element={<RebrandNotice isLandingPage={false} />} />
            )}
            
            {!isOldLandingDomain && !isOldAppDomain && (
              <>
                <Route path="/" element={
                  isMainDomain ? <Landing /> : 
                  isDocsSubdomain ? <Layout><Docs /></Layout> : 
                  <Layout><Home /></Layout>
                } />
            
            <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
            <Route path="/dapps" element={<Layout><DAppsDirectory /></Layout>} />
            <Route path="/dapp/:id" element={<Layout><DAppDetail /></Layout>} />
            <Route path="/campaign/:id" element={<Layout><CampaignDetail /></Layout>} />
            <Route path="/learn" element={<Layout><Learn /></Layout>} />
            <Route path="/news" element={<Layout><News /></Layout>} />
            <Route path="/rewards" element={<Layout><Rewards /></Layout>} />
            <Route path="/stake" element={<Layout><ComingSoon title="Point System" description="Stake and earn points feature is coming soon. Get ready for exciting rewards!" /></Layout>} />
            <Route path="/games" element={<Layout><ComingSoon title="Games Hub" description="Play fun games and earn rewards. This feature will be available soon!" /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/genesis-operators" element={<Layout><GenesisOperatorsPage /></Layout>} />
            <Route path="/submit-dapp" element={<Layout><SubmitDApp /></Layout>} />
            <Route path="/docs" element={<Layout><Docs /></Layout>} />
            <Route path="/help" element={<Layout><Help /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/social" element={<Layout><Social /></Layout>} />
            <Route path="/governance" element={<Layout><Governance /></Layout>} />
            <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
            <Route path="/fhe-debug" element={<FHEDebug />} />
            
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dapps"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminDApps />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scores"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminScores />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fhe-monitor"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminFHEMonitor />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminCampaigns />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contract-campaigns"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminContractCampaigns />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contracts"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminContracts />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reward-manager"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminRewardManager />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/learn"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminLearn />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/news"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminNews />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/submissions"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminSubmissions />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminBanners />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminAnnouncements />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/discussion-attachments"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminDiscussionAttachments />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/emojis"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminEmojis />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/genesis-operators"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <GenesisOperatorsAdmin />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
            </>
            )}
            </Routes>
          </BrowserRouter>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;