import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import type { Match, Innings } from '@crickheroes/shared';

export function LiveScorecard() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<(Match & { innings?: Innings[]; team_a?: { name: string }; team_b?: { name: string } }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMatch = async () => {
      const { data } = await api.get(`/matches/${id}`);
      setMatch(data);
      setLoading(false);
    };
    fetchMatch();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`live-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innings', filter: `match_id=eq.${id}` }, (payload) => {
        setMatch((prev) => {
          if (!prev) return prev;
          const updated = payload.new as Innings;
          const innings = prev.innings?.map((i) => i.id === updated.id ? updated : i) || [];
          return { ...prev, innings };
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, (payload) => {
        setMatch((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!match) return <div className="text-center py-12">Match not found</div>;

  const currentInnings = match.innings?.find((i) => !i.is_completed) || match.innings?.[match.innings.length - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Match Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">{match.match_type} • {match.overs_per_innings} overs</span>
          {match.status === 'live' && (
            <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> LIVE
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="font-bold text-lg">{match.team_a?.name || 'Team A'}</p>
          </div>
          <div className="text-center px-6">
            <span className="text-gray-400">vs</span>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold text-lg">{match.team_b?.name || 'Team B'}</p>
          </div>
        </div>

        {match.venue && (
          <p className="text-center text-sm text-gray-400 mt-2">📍 {match.venue}</p>
        )}
      </div>

      {/* Innings Scores */}
      {match.innings?.map((innings) => (
        <div key={innings.id} className="card mb-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              Innings {innings.innings_number}
              {!innings.is_completed && currentInnings?.id === innings.id && (
                <span className="ml-2 text-xs text-red-500">(batting)</span>
              )}
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold">{innings.total_runs}/{innings.total_wickets}</p>
              <p className="text-sm text-gray-500">
                ({Math.floor(innings.total_overs)}.{Math.round((innings.total_overs % 1) * 10)} ov)
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Extras: {innings.extras_wides}w {innings.extras_no_balls}nb {innings.extras_byes}b {innings.extras_leg_byes}lb
          </div>
        </div>
      ))}

      {/* Result */}
      {match.result_summary && (
        <div className="card text-center">
          <p className="font-bold text-cricket-green text-lg">{match.result_summary}</p>
        </div>
      )}
    </div>
  );
}
