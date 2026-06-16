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
    <div className="space-y-10" id="swedish-dashboard-hub">
      {/* Welcome Banner Card - Premium Nordic Editorial Card */}
      <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-3xl p-8 md:p-10 relative overflow-hidden scandi-shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef3c7] text-[#92400e] border border-[#fde68a] rounded-full text-[11px] font-bold uppercase tracking-wider">
            🇸🇪 VÄLKOMMEN TILL LINGOSVENSKA
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1c1917] tracking-tight leading-tight">
            Learn Swedish through structured exercises and AI voice conversations!
          </h1>
          <p className="text-[#57534e] text-sm md:text-base leading-relaxed">
            Master natural sentence structures, refine verb conjugations, and roleplay realistic Swedish conversations with constructive speaking coach feedback.
          </p>
        </div>
        <div className="hidden lg:block absolute right-12 top-0 bottom-0 w-32 border-l border-[#e7e5e4]/50 opacity-10 bg-radial from-[#fecc00] to-transparent pointer-events-none" />
      </div>

      {/* Bento Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="bento-statistics-panel">
        
        {/* Stat 1: Daily streak with flame */}
        <div className="bg-[#ffffff] border border-[#e7e5e4] p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden scandi-shadow-sm hover:border-[#d6d3d1] transition-all">
          <div className="p-3 bg-[#fffbeb] rounded-xl text-[#d97706] shrink-0 border border-[#fef3c7]">
            <Flame className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#78716c] font-bold uppercase tracking-widest block">AKTIV SVIT (STREAK)</span>
            <div className="text-xl font-extrabold text-[#1c1917] mt-0.5">{userStats.streak} dagar</div>
            <p className="text-[11px] text-[#78716c] mt-0.5">Practice daily to build memory!</p>
          </div>
        </div>

        {/* Stat 2: Total XP & progress indicator */}
        <div className="bg-[#ffffff] border border-[#e7e5e4] p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden scandi-shadow-sm hover:border-[#d6d3d1] transition-all">
          <div className="p-3 bg-[#f0fdf4] text-[#166534] shrink-0 border border-[#dcfce7]">
            <Trophy className="w-5.5 h-5.5 text-[#166534]" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-[#78716c] font-bold uppercase tracking-widest block">ERFARENHET (XP)</span>
            <div className="text-xl font-extrabold text-[#1c1917] mt-0.5">{userStats.xp} XP</div>
            
            {/* ProgressBar */}
            <div className="w-full bg-[#f5f5f4] h-1.5 rounded-full overflow-hidden mt-2 border border-[#e7e5e4]/30 relative">
              <div 
                className="bg-[#22c55e] h-full transition-all duration-500" 
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
            <p className="text-[9px] text-[#78716c] font-semibold mt-1">
              {dailyGoalPercent}% of daily goal
            </p>
          </div>
        </div>

        {/* Stat 3: Completed Grammar items */}
        <div className="bg-[#ffffff] border border-[#e7e5e4] p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden scandi-shadow-sm hover:border-[#d6d3d1] transition-all">
          <div className="p-3 bg-[#f0fdfa] text-[#0f766e] shrink-0 border border-[#ccfbf1]">
            <GraduationCap className="w-5.5 h-5.5 text-[#0f766e]" />
          </div>
          <div>
            <span className="text-[10px] text-[#78716c] font-bold uppercase tracking-widest block">GRAMMATIK</span>
            <div className="text-xl font-extrabold text-[#1c1917] mt-0.5">{userStats.completedExercises.length} klara</div>
            <p className="text-[11px] text-[#78716c] mt-0.5">Quizzes and grammar drills</p>
          </div>
        </div>

        {/* Stat 4: Roleplay chat sessions completed */}
        <div className="bg-[#ffffff] border border-[#e7e5e4] p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden scandi-shadow-sm hover:border-[#d6d3d1] transition-all">
          <div className="p-3 bg-[#faf5ff] text-[#6b21a8] shrink-0 border border-[#f3e8ff]">
            <Languages className="w-5.5 h-5.5 text-[#6b21a8]" />
          </div>
          <div>
            <span className="text-[10px] text-[#78716c] font-bold uppercase tracking-widest block">SAMTAL (CHATS)</span>
            <div className="text-xl font-extrabold text-[#1c1917] mt-0.5">{userStats.conversationsCount} pass</div>
            <p className="text-[11px] text-[#78716c] mt-0.5">Interactive speaking sessions</p>
          </div>
        </div>

      </div>

      {/* Primary Navigation Tracks */}
      <div className="space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#78716c]" id="study-route-title">VÄLJ DIN VÄG I SVENSKA (STUDY ROUTES)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="study-paths-navigation-cards">
          {/* Track 1: Interactive Grammar */}
          <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-3xl p-8 hover:border-[#a8a29e] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6 scandi-shadow-sm relative group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#f0fdfa] rounded-xl flex items-center justify-center text-[#0f766e] border border-[#ccfbf1]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1917]">1. Interactive Swedish Grammar</h3>
              <p className="text-xs text-[#57534e] leading-relaxed">
                Drill noun genders (En vs Ett), conjugated verbs (present, past, supine), or Swedish word ordering (the V2 syntax rule) through immediate, interactive validation and tips.
              </p>
            </div>
            <button
              onClick={() => onNavigate('grammar')}
              className="w-full py-3.5 bg-[#1c1917] hover:bg-[#292524] text-[#fcfbf9] font-semibold rounded-xl transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              id="start-grammar-exercises-btn"
            >
              Starta grammatik (Drill Grammar) <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Track 2: Speaking Practice roleplay */}
          <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-3xl p-8 hover:border-[#a8a29e] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6 scandi-shadow-sm relative group">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#fffbeb] rounded-xl flex items-center justify-center text-[#d97706] border border-[#fef3c7]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1c1917]">2. Speak with AI Swedish Coach</h3>
              <p className="text-xs text-[#57534e] leading-relaxed">
                Practice speaking Swedish under real life scenarios. Using speech recognition, get instant grammatical corrections, spelling coaches, and situational vocabulary directly.
              </p>
            </div>
            <button
              onClick={() => onNavigate('speaking')}
              className="w-full py-3.5 bg-[#1c1917] hover:bg-[#292524] text-[#fcfbf9] font-semibold rounded-xl transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              id="start-speaking-practice-btn"
            >
              Öva tala (Practice Speaking) <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Vocabulary notebook block (Personal Vocabulary Ordbok) */}
      <div className="bg-[#ffffff] border border-[#e7e5e4] scandi-shadow-md rounded-3xl p-8" id="personal-vocabulary-ordbok">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e7e5e4] pb-6">
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#166534]" />
              Min Ordbok (My Swedish Vocabulary Notebook)
            </h3>
            <p className="text-xs text-[#57534e]">Your compiled glossary from dialogues, exercises, and speech coaching corrections.</p>
          </div>

          {/* Filters and search block */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#a8a29e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search word..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#e7e5e4] rounded-xl text-xs outline-none focus:border-[#a8a29e] bg-[#fafaf9] text-[#1c1917]"
              />
            </div>
            
            <div className="flex items-center gap-1.5 border border-[#e7e5e4] rounded-xl px-3 py-2 bg-[#fafaf9] shrink-0">
              <ListFilter className="w-3.5 h-3.5 text-[#57534e]" />
              <select
                value={vocabFilter}
                onChange={(e) => setVocabFilter(e.target.value as any)}
                className="text-xs font-semibold text-[#1c1917] bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Alla nivåer (All)</option>
                <option value="easy">Nybörjare (Easy)</option>
                <option value="medium">Mellannivå (Medium)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vocabulary Grid */}
        <div className="pt-6">
          {filteredVocab.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredVocab.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-5 border border-[#e7e5e4] bg-[#ffffff] hover:border-[#1c1917] hover:shadow-sm rounded-2xl transition duration-150 flex justify-between items-start gap-2 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1c1917] group-hover:text-[#166534] transition">
                        {item.word}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-wider ${
                        item.level === 'medium' ? 'bg-[#fffbeb] text-[#92400e] border border-[#fef3c7]' : 'bg-[#f0fdf4] text-[#166534] border border-[#dcfce7]'
                      }`}>
                        {item.level || 'easy'}
                      </span>
                    </div>

                    <p className="text-xs text-[#57534e]">
                      English: <span className="font-medium text-[#1c1917]">{item.translation}</span>
                    </p>

                    {item.pronunciationHint && (
                      <p className="text-[10px] text-[#78716c] font-mono leading-normal max-w-xs mt-1 bg-[#faf9f6] px-1.5 py-0.5 rounded border border-[#e7e5e4]/50">
                        {item.pronunciationHint}
                      </p>
                    )}
                  </div>

                  {/* Speak button for audio feedback of particular words */}
                  <button
                    onClick={() => handleSpeak(item.word)}
                    className="p-2 hover:bg-[#f5f5f4] rounded-xl text-[#78716c] hover:text-[#1c1917] transition shrink-0 cursor-pointer border border-transparent hover:border-[#e7e5e4]"
                    title="Hör uttal (Listen to speaking)"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-[#e7e5e4] rounded-2xl bg-[#faf9f6]">
              <CheckCircle2 className="w-8 h-8 text-[#d6d3d1] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1c1917]">Inga sparade ord hittades.</p>
              <p className="text-[11px] text-[#78716c] mt-1">Complete your starting grammar quiz or practice roleplays to collect vocabulary!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
