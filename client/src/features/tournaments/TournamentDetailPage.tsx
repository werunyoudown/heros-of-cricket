import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Tournament, TournamentTeam } from '@crickheroes/shared';

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TournamentTeam[]>([]);
  const [tab, setTab] = useState<'overview' | 'standings' | 'fixtures'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tRes, sRes] = await Promise.all([
          api.get(`/tournaments/${id}`),
          api.get(`/tournaments/${id}/standings`),
        ]);
        setTournament(tRes.data);
        setStandings(sRes.data.data || sRes.data || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!tournament) return <div className="text-center py-12 text-gray-500">Tournament not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <p className="text-gray-500 mt-1">
                {tournament.city} • {tournament.format} • {tournament.overs_per_match} overs
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(tournament.start_date).toLocaleDateString()} 
                {tournament.end_date && ` — ${new Date(tournament.end_date).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={tournament.status === 'live' ? 'success' : tournament.status === 'upcoming' ? 'info' : 'default'}>
                {tournament.status}
              </Badge>
              {tournament.prize_money && <span className="text-sm text-gray-600">🏆 {tournament.prize_money}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'standings', 'fixtures'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{tournament.teams_count}</p>
                <p className="text-sm text-gray-500">Teams</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{tournament.overs_per_match}</p>
                <p className="text-sm text-gray-500">Overs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600 capitalize">{tournament.format}</p>
                <p className="text-sm text-gray-500">Format</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{tournament.entry_fee || 'Free'}</p>
                <p className="text-sm text-gray-500">Entry Fee</p>
              </div>
            </div>
            {tournament.rules_text && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-semibold mb-2">Rules</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{tournament.rules_text}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'standings' && (
        <Card>
          <CardContent className="overflow-x-auto">
            {standings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No standings yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Team</th>
                    <th className="pb-2 pr-4 text-center">P</th>
                    <th className="pb-2 pr-4 text-center">W</th>
                    <th className="pb-2 pr-4 text-center">L</th>
                    <th className="pb-2 pr-4 text-center">Pts</th>
                    <th className="pb-2 text-center">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team: any, i) => (
                    <tr key={team.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium">
                        <Link to={`/teams/${team.team_id}`} className="hover:text-primary-600">
                          {team.team?.name || 'Team'}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-center">{team.matches_played}</td>
                      <td className="py-2 pr-4 text-center text-green-600">{team.won}</td>
                      <td className="py-2 pr-4 text-center text-red-600">{team.lost}</td>
                      <td className="py-2 pr-4 text-center font-semibold">{team.points}</td>
                      <td className="py-2 text-center">{Number(team.nrr).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'fixtures' && (
        <Card>
          <CardContent>
            <p className="text-gray-500 text-center py-4">Fixtures will appear here once matches are scheduled</p>
            <div className="text-center">
              <Button variant="outline" size="sm">View All Matches</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
