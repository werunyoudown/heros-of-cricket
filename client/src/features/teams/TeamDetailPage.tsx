import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Team, TeamMember } from '@crickheroes/shared';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const [teamRes, membersRes] = await Promise.all([
          api.get(`/teams/${id}`),
          api.get(`/teams/${id}/members`),
        ]);
        setTeam(teamRes.data);
        setMembers(membersRes.data.data || membersRes.data || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTeam();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading team...</div>;
  if (!team) return <div className="text-center py-12 text-gray-500">Team not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Team Header */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            {team.logo_url ? (
              <img src={team.logo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <span className="text-primary-600 font-bold text-2xl">
                {team.short_name || team.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.city && <p className="text-gray-500">{team.city}, {team.state}</p>}
            <div className="flex gap-2 mt-2">
              <Badge variant="info">{members.length} Players</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Squad</h2>
            <Button size="sm" variant="outline">+ Add Player</Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No members yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {member.player?.full_name?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div>
                      <Link to={`/profile/${member.player_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {member.player?.full_name || 'Player'}
                      </Link>
                      <p className="text-xs text-gray-500 capitalize">{member.player?.role || 'Player'}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === 'captain' ? 'warning' : 'default'}>
                    {member.role === 'captain' ? '🏆 Captain' : member.role === 'vice_captain' ? 'VC' : 'Player'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
