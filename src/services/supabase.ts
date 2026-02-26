
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: Partial<User>) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.full_name = updates.name;
  if (updates.avatar) dbUpdates.avatar_url = updates.avatar;
  if (updates.goal) dbUpdates.goal = updates.goal;
  if (updates.language) dbUpdates.language = updates.language;
  if (updates.progress) {
    dbUpdates.mental_clarity = updates.progress.mentalClarity;
    dbUpdates.back_health = updates.progress.backHealth;
    dbUpdates.sessions_completed = updates.progress.sessionsCompleted;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const logSession = async (userId: string, movementId: string, duration: number) => {
  const { data, error } = await supabase
    .from('session_history')
    .insert({
      user_id: userId,
      movement_id: movementId,
      duration: duration
    })
    .select()
    .single();
  return { data, error };
};

export const getSessionHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  return { data, error };
};
