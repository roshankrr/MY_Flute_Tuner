export interface Swar {
  id: string;
  name: string;
  pitch: 'low' | 'mid' | 'high';
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeSong {
  id: string;
  title: string;
  notes: string;
  difficulty: 'easy' | 'medium' | 'hard';
  audio_url: string | null;
  created_at: string;
}

export interface GameScore {
  id: string;
  score: number;
  streak: number;
  session_id: string;
  created_at: string;
}
