import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import LandingPage from '@/pages/LandingPage';
import CreatorRewardsPage from '@/pages/CreatorRewardsPage';
import HomePage from '@/pages/HomePage';
import QuestsPage from '@/pages/QuestsPage';
import RafflesPage from '@/pages/RafflesPage';
import StorePage from '@/pages/StorePage';
import ProfilePage from '@/pages/ProfilePage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import AdminPage from '@/pages/AdminPage';
import FactionsPage from '@/pages/FactionsPage';
import RoadmapPage from '@/pages/RoadmapPage';
import ConversionPage from '@/pages/ConversionPage';
import StakingPage from '@/pages/StakingPage';
import PremiumPage from '@/pages/PremiumPage';
import BugReportPage from '@/pages/BugReportPage';
import BugReportsAdminPage from '@/pages/BugReportsAdminPage';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Always check if user is authenticated on app load
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public routes - no auth required */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/creator-rewards" element={<CreatorRewardsPage />} />

      {/* Protected routes - require authentication */}
      <Route
        path="/home"
        element={
          isAuthenticated ? (
            <Layout>
              <HomePage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/quests"
        element={
          isAuthenticated ? (
            <Layout>
              <QuestsPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/raffles"
        element={
          isAuthenticated ? (
            <Layout>
              <RafflesPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/store"
        element={
          isAuthenticated ? (
            <Layout>
              <StorePage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <Layout>
              <ProfilePage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/admin"
        element={
          isAuthenticated ? (
            <Layout>
              <AdminPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/factions"
        element={
          isAuthenticated ? (
            <Layout>
              <FactionsPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/conversion"
        element={
          isAuthenticated ? (
            <Layout>
              <ConversionPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/staking"
        element={
          isAuthenticated ? (
            <Layout>
              <StakingPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/premium"
        element={
          isAuthenticated ? (
            <Layout>
              <PremiumPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/bug-report"
        element={
          <Layout>
            <BugReportPage />
          </Layout>
        }
      />
      <Route
        path="/admin/bug-reports"
        element={
          isAuthenticated ? (
            <Layout>
              <BugReportsAdminPage />
            </Layout>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;