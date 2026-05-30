import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Match } from '@crickheroes/shared';

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'live' | 'completed' | 'upcoming'>('live');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/matches?status=${filter}`);
        setMatches(data.data || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matches</h1>
        <Link to="/matches/new" className="btn-primary text-sm">+ New Match</Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['live', 'upcoming', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'live' && '🔴 '}
            {status}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No {filter} matches found</div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match & { team_a?: { name: string; logo_url: string | null }; team_b?: { name: string; logo_url: string | null } } }) {
  return (
    <Link to={`/matches/${match.id}`} className="card block hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">{match.match_type} • {match.overs_per_innings} overs</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          match.status === 'live' ? 'bg-red-100 text-red-700' :
          match.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {match.status === 'live' && '🔴 '}{match.status.toUpperCase()}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="font-semibold">{(match as unknown as { team_a?: { name: string } }).team_a?.name || 'Team A'}</p>
        </div>
        <div className="text-center px-4">
          <span className="text-gray-400 text-sm">vs</span>
        </div>
        <div className="flex-1 text-right">
          <p className="font-semibold">{(match as unknown as { team_b?: { name: string } }).team_b?.name || 'Team B'}</p>
        </div>
      </div>

      {match.result_summary && (
        <p className="text-sm text-gray-600 mt-2 text-center">{match.result_summary}</p>
      )}

      {match.venue && (
        <p className="text-xs text-gray-400 mt-2">📍 {match.venue}</p>
      )}
    </Link>
  );
}
