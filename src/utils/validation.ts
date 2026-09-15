import { z } from 'zod';
import { GOAL_IDS, normalizeGoal } from '../constants/goals';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const cleanText = (value: string) => value.normalize('NFKC').replace(CONTROL_CHARS, '').trim();

export const allowedGoals = GOAL_IDS;

export const emailSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().email('Enter a valid email address.').max(254, 'Email is too long.'))
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.');

export const displayNameSchema = z
  .string()
  .transform(cleanText)
  .pipe(
    z
      .string()
      .min(2, 'Name must be at least 2 characters.')
      .max(80, 'Name must be 80 characters or fewer.')
      .regex(/^[\p{L}\p{M}\p{N} .'-]+$/u, 'Name contains unsupported characters.')
  );

export const avatarUrlSchema = z
  .string()
  .transform(cleanText)
  .pipe(
    z.string().max(2048, 'Avatar URL is too long.').refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
      } catch {
        return false;
      }
    }, 'Avatar must be a valid http or https URL.')
  );

// Aceptamos tanto el id canónico como las etiquetas antiguas guardadas en perfiles
// existentes: normalizamos primero y validamos después.
export const goalSchema = z
  .unknown()
  .transform(normalizeGoal)
  .pipe(z.enum(allowedGoals, { message: 'Unknown goal.' }));
export const languageSchema = z.enum(['en', 'es']);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(128, 'Password is too long.'),
});

export const registrationSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  goal: goalSchema,
});

export const profileSchema = z.object({
  id: z.string().uuid().optional(),
  name: displayNameSchema,
  email: emailSchema,
  avatar: avatarUrlSchema,
  goal: goalSchema.optional(),
  language: languageSchema,
  progress: z.object({
    mentalClarity: z.number().min(0).max(10),
    backHealth: z.number().min(0).max(100),
    sessionsCompleted: z.number().int().min(0).max(100000),
  }),
});

export const profileUpdateSchema = profileSchema.partial().extend({
  progress: profileSchema.shape.progress.optional(),
});

export const chatMessageSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(1, 'Message is required.').max(1000, 'Message must be 1000 characters or fewer.'));

export const movementIdSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().regex(/^[a-z0-9_-]{1,80}$/i, 'Invalid movement id.'));

export const mindGameIdSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().regex(/^[a-z0-9_-]{1,80}$/i, 'Invalid mind game id.'));

export const scoreSchema = z.number().int().min(0).max(100).nullable();

export const variantSeedSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().regex(/^[a-z0-9_-]{1,120}$/i, 'Invalid variant seed.'));

export const durationSchema = z.number().int().min(10).max(3600);

export const firstValidationError = (error: z.ZodError) => error.issues[0]?.message || 'Invalid input.';
