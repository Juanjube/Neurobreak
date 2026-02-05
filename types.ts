
export interface User {
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

export enum Page {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  MOVEMENT_ENGINE = 'movement_engine',
  RITUAL = 'ritual',
  INSIGHTS = 'insights',
  SETTINGS = 'settings'
}

export type Language = 'en' | 'es';
