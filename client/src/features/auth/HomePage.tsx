import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Cricket Matters
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Score matches, track stats, manage tournaments — all in one place.
          </p>
          {!isAuthenticated && (
            <div className="flex gap-4 justify-center">
              <Link to="/signup" className="bg-white text-primary-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                Get Started Free
              </Link>
              <Link to="/matches" className="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors">
                View Live Matches
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why CricHeroes?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🏏"
            title="Live Scoring"
            description="Ball-by-ball scoring with real-time updates. Keep track of every delivery."
          />
          <FeatureCard
            icon="🏆"
            title="Tournament Management"
            description="Organize tournaments with auto-fixtures, points table, and bracket views."
          />
          <FeatureCard
            icon="📊"
            title="Player Statistics"
            description="Comprehensive batting and bowling stats. Track your career progression."
          />
          <FeatureCard
            icon="👥"
            title="Team Management"
            description="Create teams, manage rosters, track team performance."
          />
          <FeatureCard
            icon="🌐"
            title="Community"
            description="Connect with cricketers, share updates, follow your favorite players."
          />
          <FeatureCard
            icon="🔍"
            title="Looking For"
            description="Find players, teams, opponents, umpires — all in one marketplace."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard number="10K+" label="Matches Scored" />
            <StatCard number="5K+" label="Players" />
            <StatCard number="500+" label="Teams" />
            <StatCard number="100+" label="Tournaments" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-primary-600">{number}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}
