import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function Navbar() {
  const { isAuthenticated, profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary-600">
              🏏 CricHeroes
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/matches" className="text-gray-600 hover:text-gray-900 font-medium">
                Matches
              </Link>
              <Link to="/tournaments" className="text-gray-600 hover:text-gray-900 font-medium">
                Tournaments
              </Link>
              <Link to="/teams" className="text-gray-600 hover:text-gray-900 font-medium">
                Teams
              </Link>
              <Link to="/community" className="text-gray-600 hover:text-gray-900 font-medium">
                Community
              </Link>
              <Link to="/looking-for" className="text-gray-600 hover:text-gray-900 font-medium">
                Looking For
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/matches/new" className="btn-primary text-sm">
                  + Score Match
                </Link>
                <Link to={`/profile/${profile?.id || ''}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-primary-600 text-sm font-medium">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </Link>
                <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 text-sm">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
