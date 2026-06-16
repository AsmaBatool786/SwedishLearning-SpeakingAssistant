export type ExerciseCategory = 'en-ett' | 'verbs' | 'word-order' | 'vocab';

export interface BaseQuestion {
  id: string;
  category: ExerciseCategory;
  question: string;
  hint?: string;
  explanation: string;
}

export interface EnEttQuestion extends BaseQuestion {
  word: string;
  correctAnswer: 'en' | 'ett';
}

export interface VerbQuestion extends BaseQuestion {
  sentenceWithBlank: string; // e.g. "Vi ______ (att dricka) kaffe varje dag."
  options: string[];
  correctAnswer: string;
}

export interface WordOrderQuestion extends BaseQuestion {
  scrambledWords: string[];
  correctAnswer: string; // The joined correct Swedish sentence
}

export interface VocabQuestion extends BaseQuestion {
  englishPhrase: string;
  swedishPhrase: string;
  options: string[];
  correctAnswer: string;
}

export type Question = EnEttQuestion | VerbQuestion | WordOrderQuestion | VocabQuestion;

export interface UserStats {
  xp: number;
  streak: number;
  dailyGoal: number; // e.g., 50 XP
  completedExercises: string[]; // question ids
  conversationsCount: number;
  vocabLearned: { word: string; translation: string; pronunciationHint?: string; level?: 'easy' | 'medium' | 'hard' }[];
}

export interface PracticeScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2';
  icon: string;
  suggestedPhrases: string[];
  initialAiGreeting: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // The Swedish text
  translation?: string; // Translated to English
  feedback?: {
    correctedSwedish?: string;
    hasErrors: boolean;
    explanation?: string; // Feedback on grammar, spelling, or naturalness
    vocabTips?: { Swedish: string; English: string; definition: string }[];
  };
  audioBase64?: string; // Optional if we use backend speech synthesizers
}
