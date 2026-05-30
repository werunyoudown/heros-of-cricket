import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Team } from '@crickheroes/shared';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/teams', { params: { search } });
        setTeams(data.data || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link to="/teams/create">
          <Button size="sm">+ Create Team</Button>
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No teams found</p>
          <Link to="/teams/create">
            <Button variant="outline">Create your first team</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link key={team.id} to={`/teams/${team.id}`}>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <span className="text-primary-600 font-bold text-lg">
                        {team.short_name || team.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
                    {team.city && (
                      <p className="text-sm text-gray-500">{team.city}, {team.state}</p>
                    )}
                    <Badge variant="info" className="mt-1">{team.short_name || 'Team'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
