
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';
import {
  displayNameSchema,
  durationSchema,
  firstValidationError,
  mindGameIdSchema,
  movementIdSchema,
  profileUpdateSchema,
  scoreSchema,
  variantSeedSchema,
} from '../utils/validation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getCurrentUserId = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user?.id) {
    throw new Error('Authentication required');
  }

  return session.user.id;
};

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
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, fullName: string, goal?: string) => {
  const safeName = displayNameSchema.parse(fullName);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: safeName,
        goal: goal
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
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot read another user profile');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: Partial<User>) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot update another user profile');
  }

  const parsed = profileUpdateSchema.safeParse(updates);
  if (!parsed.success) {
    throw new Error(firstValidationError(parsed.error));
  }

  const dbUpdates: any = {};
  if (parsed.data.name) dbUpdates.full_name = parsed.data.name;
  if (parsed.data.avatar !== undefined) dbUpdates.avatar_url = parsed.data.avatar;
  if (parsed.data.goal) dbUpdates.goal = parsed.data.goal;
  if (parsed.data.language) dbUpdates.language = parsed.data.language;
  if (parsed.data.progress) {
    dbUpdates.mental_clarity = parsed.data.progress.mentalClarity;
    dbUpdates.back_health = parsed.data.progress.backHealth;
    dbUpdates.sessions_completed = parsed.data.progress.sessionsCompleted;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', currentUserId)
    .select()
    .single();
  return { data, error };
};

export const logSession = async (userId: string, movementId: string, duration: number) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot log a session for another user');
  }

  const safeMovementId = movementIdSchema.parse(movementId);
  const safeDuration = durationSchema.parse(duration);

  const { data, error } = await supabase
    .from('session_history')
    .insert({
      user_id: currentUserId,
      movement_id: safeMovementId,
      duration: safeDuration
    })
    .select()
    .single();
  return { data, error };
};

export const getSessionHistory = async (userId: string) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot read another user session history');
  }

  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('user_id', currentUserId)
    .order('completed_at', { ascending: false });
  return { data, error };
};

export const logMindGameSession = async (
  userId: string,
  gameId: string,
  score: number | null,
  duration: number,
  variantSeed: string
) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot log a mind game session for another user');
  }

  const safeGameId = mindGameIdSchema.parse(gameId);
  const safeScore = scoreSchema.parse(score);
  const safeDuration = durationSchema.parse(duration);
  const safeVariantSeed = variantSeedSchema.parse(variantSeed);

  const { data, error } = await supabase
    .from('mental_game_history')
    .insert({
      user_id: currentUserId,
      game_id: safeGameId,
      score: safeScore,
      duration: safeDuration,
      variant_seed: safeVariantSeed
    })
    .select()
    .single();
  return { data, error };
};

export const getMindGameHistory = async (userId: string, limit = 20) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot read another user mind game history');
  }

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

  const { data, error } = await supabase
    .from('mental_game_history')
    .select('*')
    .eq('user_id', currentUserId)
    .order('completed_at', { ascending: false })
    .limit(safeLimit);
  return { data, error };
};
