
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';
import {
  displayNameSchema,
  durationSchema,
  emailSchema,
  avatarUrlSchema,
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

export const requestPasswordReset = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}`,
  });
  return { data, error };
};

const PROFILE_AVATAR_BUCKET = 'profile-avatars';
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const uploadProfileAvatar = async (userId: string, file: File) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) throw new Error('Cannot upload an avatar for another user');
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, or WEBP image.');
  if (file.size > MAX_AVATAR_BYTES) throw new Error('The image must be 5 MB or smaller.');

  const { error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(`${currentUserId}/avatar`, file, { cacheControl: '3600', contentType: file.type, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(`${currentUserId}/avatar`);
  return `${data.publicUrl}?v=${Date.now()}`;
};

/**
 * Keeps the identity shown in NeuroBreak aligned with Supabase Auth.
 * Email changes can require confirmation depending on the Supabase project settings.
 */
export const updateAccountDetails = async (userId: string, name: string, email: string, avatar?: string) => {
  const currentUserId = await getCurrentUserId();
  if (userId !== currentUserId) {
    throw new Error('Cannot update another user account');
  }

  const safeName = displayNameSchema.parse(name);
  const safeEmail = emailSchema.parse(email);
  const safeAvatar = avatar === undefined ? undefined : avatarUrlSchema.parse(avatar);
  const { data: { user: currentAuthUser }, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentAuthUser) {
    throw currentUserError || new Error('Authentication required');
  }

  const authUpdates: { data: { full_name: string; avatar_url?: string }; email?: string } = {
    data: { full_name: safeName, ...(safeAvatar !== undefined ? { avatar_url: safeAvatar } : {}) },
  };
  if (safeEmail !== currentAuthUser.email?.toLowerCase()) {
    authUpdates.email = safeEmail;
  }

  const { data: authData, error: authError } = await supabase.auth.updateUser(authUpdates);
  if (authError) return { data: null, error: authError, emailChangeRequested: Boolean(authUpdates.email) };

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: safeName, ...(safeAvatar !== undefined ? { avatar_url: safeAvatar } : {}) })
    .eq('id', currentUserId)
    .select()
    .single();

  return {
    data,
    error,
    emailChangeRequested: Boolean(authUpdates.email),
    emailUpdated: authData.user?.email?.toLowerCase() === safeEmail,
  };
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
