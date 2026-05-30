import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { HomePage } from '@/features/auth/HomePage';
import { MatchesPage } from '@/features/scoring/MatchesPage';
import { ScoringPage } from '@/features/scoring/ScoringPage';
import { LiveScorecard } from '@/features/scoring/LiveScorecard';
import { CreateMatchPage } from '@/features/scoring/CreateMatchPage';
import { TeamsPage } from '@/features/teams/TeamsPage';
import { TeamDetailPage } from '@/features/teams/TeamDetailPage';
import { CreateTeamPage } from '@/features/teams/CreateTeamPage';
import { TournamentsPage } from '@/features/tournaments/TournamentsPage';
import { TournamentDetailPage } from '@/features/tournaments/TournamentDetailPage';
import { CommunityPage } from '@/features/community/CommunityPage';
import { LookingForPage } from '@/features/looking-for/LookingForPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { EditProfilePage } from '@/features/profile/EditProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<LiveScorecard />} />

        {/* Protected */}
        <Route path="/matches/new" element={<ProtectedRoute><CreateMatchPage /></ProtectedRoute>} />
        <Route path="/matches/:id/score" element={<ProtectedRoute><ScoringPage /></ProtectedRoute>} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/create" element={<ProtectedRoute><CreateTeamPage /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<TeamDetailPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/looking-for" element={<LookingForPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<div className="p-8 text-center text-gray-500">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
