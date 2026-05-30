import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import type { Profile, PlayerStats } from '@crickheroes/shared';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile: myProfile } = useAuthStore();
  const [player, setPlayer] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwn = myProfile?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get(`/players/${id}/stats`),
        ]);
        setPlayer(profileRes.data);
        setStats(statsRes.data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/players/${id}/follow`);
      } else {
        await api.post(`/players/${id}/follow`);
      }
      setIsFollowing(!isFollowing);
    } catch {
      // handle error
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading profile...</div>;
  if (!player) return <div className="text-center py-12 text-gray-500">Player not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="text-primary-600 font-bold text-3xl">
                  {player.full_name?.charAt(0) || 'P'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{player.full_name}</h1>
                  {player.city && <p className="text-gray-500">{player.city}, {player.state}</p>}
                  <div className="flex gap-2 mt-2">
                    {player.role && <Badge variant="info" className="capitalize">{player.role.replace('_', ' ')}</Badge>}
                    {player.batting_style && <Badge>{player.batting_style.replace('_', ' ')}</Badge>}
                    {player.is_pro && <Badge variant="warning">PRO</Badge>}
                  </div>
                </div>
                {isOwn ? (
                  <Link to="/profile/edit">
                    <Button size="sm" variant="outline">Edit Profile</Button>
                  </Link>
                ) : (
                  <Button size="sm" variant={isFollowing ? 'secondary' : 'primary'} onClick={handleFollow}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
              {player.bio && <p className="text-sm text-gray-600 mt-3">{player.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Batting Stats */}
          <Card>
            <CardHeader><h2 className="font-semibold">🏏 Batting</h2></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <StatItem label="Matches" value={stats.matches_played} />
                <StatItem label="Runs" value={stats.total_runs} />
                <StatItem label="High Score" value={stats.highest_score} />
                <StatItem label="Average" value={stats.batting_average?.toFixed(1)} />
                <StatItem label="SR" value={stats.strike_rate?.toFixed(1)} />
                <StatItem label="50s/100s" value={`${stats.fifties}/${stats.hundreds}`} />
              </div>
            </CardContent>
          </Card>

          {/* Bowling Stats */}
          <Card>
            <CardHeader><h2 className="font-semibold">🎳 Bowling</h2></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <StatItem label="Wickets" value={stats.total_wickets} />
                <StatItem label="Best" value={stats.best_bowling || '-'} />
                <StatItem label="Average" value={stats.bowling_average?.toFixed(1)} />
                <StatItem label="Economy" value={stats.bowling_economy?.toFixed(1)} />
                <StatItem label="SR" value={stats.bowling_strike_rate?.toFixed(1)} />
                <StatItem label="Catches" value={stats.catches} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div>
      <p className="text-xl font-bold text-gray-900">{value ?? '-'}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
