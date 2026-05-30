import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@crickheroes/shared';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user, session, isAuthenticated: true });
        await get().fetchProfile();
      }
    } finally {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user || null,
        session,
        isAuthenticated: !!session,
      });
      if (session) {
        get().fetchProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  signUp: async (email, password, fullName) => {
    const { data } = await api.post('/auth/signup', { email, password, full_name: fullName });

    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true,
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ profile: data });
    } catch {
      // Profile may not exist yet
    }
  },
}));
