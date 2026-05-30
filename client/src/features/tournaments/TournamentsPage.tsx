import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Tournament } from '@crickheroes/shared';

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'live' | 'completed'>('live');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/tournaments?status=${filter}`);
        setTournaments(data.data || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [filter]);

  const statusColor = (status: string) => {
    if (status === 'live') return 'success';
    if (status === 'upcoming') return 'info';
    return 'default';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Link to="/tournaments/create">
          <Button size="sm">+ Create Tournament</Button>
        </Link>
      </div>

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
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No {filter} tournaments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map((t) => (
            <Link key={t.id} to={`/tournaments/${t.id}`}>
              <Card hover>
                <CardContent>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <Badge variant={statusColor(t.status)}>{t.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>📍 {t.city || 'TBD'}</p>
                    <p>🏏 {t.overs_per_match} overs • {t.format} • {t.teams_count} teams</p>
                    <p>📅 {new Date(t.start_date).toLocaleDateString()}</p>
                    {t.prize_money && <p>🏆 Prize: {t.prize_money}</p>}
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
