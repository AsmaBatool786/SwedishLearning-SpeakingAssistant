import React, { useState } from 'react';
import { UserStats } from '../types';
import { 
  Trophy, Flame, Award, BookOpen, Volume2, Search, Play, GraduationCap, 
  Sparkles, CheckCircle2, Languages, ListFilter 
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  userStats: UserStats;
  onNavigate: (tab: 'grammar' | 'speaking') => void;
}

export default function Dashboard({ userStats, onNavigate }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vocabFilter, setVocabFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // Text-to-Speech trigger for vocab notebook
  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'sv-SE';
      const voices = window.speechSynthesis.getVoices();
      const swedishVoice = voices.find((v) => v.lang.startsWith('sv'));
      if (swedishVoice) {
        utterance.voice = swedishVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Filtered vocabulary list
  const filteredVocab = userStats.vocabLearned.filter((v) => {
    const matchesSearch = v.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.translation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = vocabFilter === 'all' || v.level === vocabFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate XP ratio towards daily target goal
  const dailyGoalPercent = Math.min(Math.round((userStats.xp / userStats.dailyGoal) * 100), 100);

  return (
    <div className="space-y-8" id="swedish-dashboard-hub">
      {/* Welcome Banner Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-650 rounded-full text-xs font-semibold uppercase tracking-wider">
            🇸🇪 Välkommen till LingoSvenska
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1e293b] tracking-tight leading-tight">
            Learn Swedish through structured exercises and AI voice conversations!
          </h1>
          <p className="text-[#64748b] text-sm md:text-base leading-relaxed">
            Build syntax using the V2 rule, refine your En vs Ett noun genders, and roleplay real scenarios with feedback from an automated speech-recognizing tutor.
          </p>
        </div>
      </div>

      {/* Bento Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="bento-statistics-panel">
        
        {/* Stat 1: Daily streak with flame */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <Flame className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider block">Aktiv svit (Streak)</span>
            <div className="text-xl font-bold text-[#1e293b] mt-0.5">{userStats.streak} dagar</div>
            <p className="text-[11px] text-[#64748b] mt-0.5">Practice daily to build memory!</p>
          </div>
        </div>

        {/* Stat 2: Total XP & progress indicator */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <Trophy className="w-5.5 h-5.5 text-blue-600" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider block">Erfarenhet (XP)</span>
            <div className="text-xl font-bold text-[#1e293b] mt-0.5">{userStats.xp} XP</div>
            
            {/* ProgressBar */}
            <div className="w-full bg-[#e2e8f0] h-1 rounded-full overflow-hidden mt-2 relative">
              <div 
                className="bg-blue-600 h-full transition-all duration-500" 
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
            <p className="text-[9px] text-[#64748b] font-medium mt-1">
              {dailyGoalPercent}% of daily goal
            </p>
          </div>
        </div>

        {/* Stat 3: Completed Grammar items */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <GraduationCap className="w-5.5 h-5.5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider block">Grammatik (Exercises)</span>
            <div className="text-xl font-bold text-[#1e293b] mt-0.5">{userStats.completedExercises.length} klara</div>
            <p className="text-[11px] text-[#64748b] mt-0.5">Quizzes and grammar drills</p>
          </div>
        </div>

        {/* Stat 4: Roleplay chat sessions completed */}
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600 shrink-0">
            <Languages className="w-5.5 h-5.5 text-violet-600" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider block">Konversationer (Conversations)</span>
            <div className="text-xl font-bold text-[#1e293b] mt-0.5">{userStats.conversationsCount} pass</div>
            <p className="text-[11px] text-[#64748b] mt-0.5">Interactive speaking dialogs</p>
          </div>
        </div>

      </div>

      {/* Primary Navigation Tracks */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#64748b]" id="study-route-title">Välj din väg i svenska (Select your study route)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="study-paths-navigation-cards">
          {/* Track 1: Interactive Grammar */}
          <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 hover:border-blue-300 transition duration-200 flex flex-col justify-between space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b]">1. Interactive Swedish Grammar</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Drill noun genders (En vs Ett), conjugated verbs (present, past, supine), or Swedish word ordering (the V2 syntax rule) through immediate, interactive validation and tips.
              </p>
            </div>
            <button
              onClick={() => onNavigate('grammar')}
              className="w-full py-3 bg-[#1e293b] hover:bg-slate-800 text-white font-medium rounded-xl transition text-xs cursor-pointer flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              id="start-grammar-exercises-btn"
            >
              Starta grammatik (Drill Grammar) <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Track 2: Speaking Practice roleplay */}
          <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 hover:border-blue-300 transition duration-200 flex flex-col justify-between space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b]">2. Speak with AI Swedish Coach</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Practice speaking Swedish under real life scenarios. Using speech recognition, get instant grammatical corrections, spelling coaches, and situational vocabulary directly.
              </p>
            </div>
            <button
              onClick={() => onNavigate('speaking')}
              className="w-full py-3 bg-[#1e293b] hover:bg-slate-800 text-white font-medium rounded-xl transition text-xs cursor-pointer flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              id="start-speaking-practice-btn"
            >
              Öva tala (Practice Speaking) <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Vocabulary notebook block (Personal Vocabulary Ordbok) */}
      <div className="bg-white border border-[#e2e8f0] shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-3xl p-6" id="personal-vocabulary-ordbok">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e2e8f0] pb-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#1e293b] flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-emerald-600" />
              Min Ordbok (My Swedish Vocabulary Notebook)
            </h3>
            <p className="text-xs text-[#64748b]">Your compiled glossary from dialogues, exercises, and speech coaching corrections.</p>
          </div>

          {/* Filters and search block */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search word..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-[#e2e8f0] rounded-xl text-xs outline-none focus:border-blue-500 bg-[#f8fafc]"
              />
            </div>
            
            <div className="flex items-center gap-1.5 border border-[#e2e8f0] rounded-xl px-3 py-1.5 bg-[#f8fafc] shrink-0">
              <ListFilter className="w-3.5 h-3.5 text-[#64748b]" />
              <select
                value={vocabFilter}
                onChange={(e) => setVocabFilter(e.target.value as any)}
                className="text-xs font-medium text-[#1e293b] bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Alla nivåer (All)</option>
                <option value="easy">Nybörjare (Easy)</option>
                <option value="medium">Mellannivå (Medium)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vocabulary Grid */}
        <div className="pt-5">
          {filteredVocab.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredVocab.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-4 border border-[#e2e8f0] bg-white hover:border-emerald-350 hover:shadow-[0_2px_4px_rgba(0,0,0,0.01)] rounded-2xl transition flex justify-between items-start gap-2 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-[#1e293b] group-hover:text-emerald-700 transition">
                        {item.word}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase ${
                        item.level === 'medium' ? 'bg-amber-55 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {item.level || 'easy'}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748b]">
                      English: {item.translation}
                    </p>

                    {item.pronunciationHint && (
                      <p className="text-[10px] text-[#64748b] leading-normal max-w-xs mt-1">
                        {item.pronunciationHint}
                      </p>
                    )}
                  </div>

                  {/* Speak button for audio feedback of particular words */}
                  <button
                    onClick={() => handleSpeak(item.word)}
                    className="p-1.5 hover:bg-[#eff6ff] rounded-xl text-[#64748b] hover:text-blue-600 transition shrink-0 cursor-pointer"
                    title="Hör uttal (Listen to speaking)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#e2e8f0] rounded-2xl bg-slate-50/50">
              <CheckCircle2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#1e293b]">Inga sparade ord hittades.</p>
              <p className="text-[11px] text-[#64748b] mt-1">Complete your starting grammar quiz or practice roleplays to collect vocabulary!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
