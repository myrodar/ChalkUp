
export interface User {
  id: string;
  name: string;
  email?: string;
  gender: 'male' | 'female' | 'other';
  university: string;
  isAdmin?: boolean;
  totalPoints?: number;
  currentCompetitionId?: string;
  avatar_url?: string;
}

export interface Boulder {
  id: string;
  name: string;
  color: string; // Changed from grade to color
  pointsForFirst: number;
  pointsForSecond: number;
  pointsForThird: number;
  pointsForFourth: number;
  pointsForFifth: number;
  pointsForZone: number;
  pointsForSend?: number; // Legacy field required by the database
  isActive: boolean;
  order: number;
  competitionId: number; // Required field, must be a number to match database
}

export type AttemptCount = '1' | '2' | '3' | '4' | '5' | '5+' | 'none';

export interface Attempt {
  id: string;
  userId: string;
  boulderId: string;
  sendAttempts: number;
  zoneAttempts: number;
  timestamp: string;
  competitionId: string;
  status: 'none' | 'zone' | 'sent' | 'flash';
  validated?: boolean;
}

export interface Competition {
  id: number;
  name: string;
  location: string;
  isLeaderboardPublic: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  university: string;
  gender?: 'male' | 'female' | 'other' | null;
  totalPoints: number;
  totalBoulders: number;
  totalFlashes: number;
  competitionId: string | number;
}

// Language settings
export type Language = 'en' | 'fr';

// Translations type
export interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}
