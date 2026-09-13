
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  goal?: string;
  language: 'en' | 'es';
  progress: {
    mentalClarity: number;
    backHealth: number;
    sessionsCompleted: number;
  };
}

export type MovementCategory = 'Spine' | 'Focus' | 'Decompression' | 'Eyes' | 'Energy';

export interface Movement {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  icon: string;
  category: MovementCategory;
  recommended?: boolean;
  neuroBenefit: string;
  intensity: 'Low' | 'Medium' | 'High';
}

export type MindGameCategory = 'Memory' | 'Focus' | 'Pattern' | 'Number' | 'Change' | 'Timing' | 'Breathing';

export interface MindGame {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  icon: string;
  category: MindGameCategory;
  neuroBenefit: string;
  difficulty: 'Easy' | 'Medium';
  iconAsset?: string;
  titleEs?: string;
  descriptionEs?: string;
}

export interface MindGameSession {
  id: string;
  user_id: string;
  game_id: string;
  score: number | null;
  duration: number;
  variant_seed: string;
  completed_at: string;
}

export enum Page {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  MOVEMENT_ENGINE = 'movement_engine',
  MIND_GAMES = 'mind_games',
  RITUAL = 'ritual',
  INSIGHTS = 'insights',
  PROFILE = 'profile',
  PROFILE_EDIT = 'profile_edit',
  SETTINGS = 'settings'
}

export type Language = 'en' | 'es';
