import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import type { Match, Innings, BallByBall } from '@crickheroes/shared';
import { RecordBallRequest } from '@crickheroes/shared';

interface ScoringState {
  currentMatch: Match | null;
  currentInnings: Innings | null;
  balls: BallByBall[];
  isLive: boolean;
  subscribeToMatch: (matchId: string) => void;
  unsubscribe: () => void;
  recordBall: (matchId: string, ball: RecordBallRequest) => Promise<void>;
  undoLastBall: (matchId: string) => Promise<void>;
  loadMatch: (matchId: string) => Promise<void>;
}

export const useScoringStore = create<ScoringState>((set, get) => ({
  currentMatch: null,
  currentInnings: null,
  balls: [],
  isLive: false,

  loadMatch: async (matchId) => {
    const { data } = await api.get(`/matches/${matchId}`);
    const match = data as Match & { innings: Innings[] };
    const activeInnings = match.innings?.find((i: Innings) => !i.is_completed) || match.innings?.[match.innings.length - 1];
    set({ currentMatch: match, currentInnings: activeInnings || null });

    // Load balls
    const { data: balls } = await api.get(`/matches/${matchId}/ball-by-ball`);
    set({ balls: balls || [] });
  },

  subscribeToMatch: (matchId) => {
    // Subscribe to realtime updates on innings
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'innings', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updatedInnings = payload.new as Innings;
          set({ currentInnings: updatedInnings });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ball_by_ball' },
        (payload) => {
          const newBall = payload.new as BallByBall;
          set((state) => ({ balls: [...state.balls, newBall] }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          set({ currentMatch: payload.new as Match });
        }
      )
      .subscribe();

    set({ isLive: true });

    // Store channel reference for cleanup
    (get() as unknown as { _channel: typeof channel })._channel = channel;
  },

  unsubscribe: () => {
    const state = get() as unknown as { _channel?: ReturnType<typeof supabase.channel> };
    if (state._channel) {
      supabase.removeChannel(state._channel);
    }
    set({ isLive: false });
  },

  recordBall: async (matchId, ball) => {
    await api.post(`/matches/${matchId}/ball`, ball);
    // Realtime subscription will handle the state update
  },

  undoLastBall: async (matchId) => {
    await api.delete(`/matches/${matchId}/ball/last`);
    // Reload to get fresh state
    await get().loadMatch(matchId);
  },
}));
