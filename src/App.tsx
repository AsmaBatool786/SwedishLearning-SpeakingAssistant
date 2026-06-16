import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserStats } from './types';
import Dashboard from './components/Dashboard';
import GrammarPanel from './components/GrammarPanel';
import SpeakingPanel from './components/SpeakingPanel';
import { Flame, Award, BookOpen, GraduationCap, Sparkles, Navigation } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'grammar' | 'speaking'>('dashboard');

  // Standard user Swedish learning progress statistics
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 45,
    streak: 3,
    dailyGoal: 100,
    completedExercises: [],
    conversationsCount: 1,
    // Prepopulate some essential starting vocabulary items to present a beautiful, functional first loading state
    vocabLearned: [
      { word: 'Hej', translation: 'Hello / Hi', pronunciationHint: 'Pronounced: Hay', level: 'easy' },
      { word: 'Tack', translation: 'Thank you', pronunciationHint: 'Pronounced: Tahk', level: 'easy' },
      { word: 'Fika', translation: 'Coffee and cake break', pronunciationHint: 'Swedish ritual of coffee and pastry', level: 'easy' },
      { word: 'Kanelbulle', translation: 'Cinnamon bun', pronunciationHint: 'Classic Swedish cinnamon roll', level: 'easy' },
      { word: 'Lagom', translation: 'Just the right amount', pronunciationHint: 'Not too much, not too little', level: 'medium' }
    ],
  });

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#292524] font-sans selection:bg-[#fecc00]/20 flex flex-col" id="swedish-app-frame">
      {/* Visual Navigation Header with a thin premium top accent line */}
      <div className="h-1.5 w-full nordic-flag-accent shrink-0" />
      <header className="sticky top-0 z-50 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#e7e5e4] shadow-[0_2px_12px_rgba(41,37,36,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-98 transition-all select-none"
            id="brand-logo-trigger"
          >
            <div className="text-xl shrink-0 p-2 bg-[#faf9f5] border border-[#e7e5e4] rounded-2xl flex items-center justify-center shadow-sm">🇸🇪</div>
            <div>
              <h1 className="font-bold text-[#1c1917] leading-none text-base tracking-tight flex items-center gap-1.5">
                LingoSvenska
              </h1>
              <p className="text-[10px] text-[#78716c] font-medium tracking-wide mt-1">NORDIC LANGUAGE STUDIO</p>
            </div>
          </div>

          {/* Premium Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f5f5f4] p-1.2 rounded-2xl border border-[#e7e5e4]" id="desktop-nav-links">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#1c1917] text-[#fcfbf9] shadow-sm'
                  : 'text-[#57534e] hover:text-[#1c1917] hover:bg-[#eae8e5]'
              }`}
            >
              Överblick (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'grammar'
                  ? 'bg-[#1c1917] text-[#fcfbf9] shadow-sm'
                  : 'text-[#57534e] hover:text-[#1c1917] hover:bg-[#eae8e5]'
              }`}
            >
              Grammar Bank
            </button>
            <button
              onClick={() => setActiveTab('speaking')}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'speaking'
                  ? 'bg-[#1c1917] text-[#fcfbf9] shadow-sm'
                  : 'text-[#57534e] hover:text-[#1c1917] hover:bg-[#eae8e5]'
              }`}
            >
              Speech Lab
            </button>
          </nav>

          {/* Quick Metrics display info */}
          <div className="flex items-center gap-2" id="header-metrics-capsules">
            {/* Streak capsule */}
            <div className="flex items-center gap-1.5 bg-[#fef3c7] text-[#92400e] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#fde68a]/50 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-[#d97706] fill-[#fef3c7]" />
              <span>{userStats.streak} dag svit</span>
            </div>

            {/* XP Level capsule */}
            <div className="flex items-center gap-1.5 bg-[#f0fdf4] text-[#166534] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#dcfce7]/50 shadow-sm">
              <Award className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{userStats.xp} XP</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                userStats={userStats} 
                onNavigate={(tab) => setActiveTab(tab)} 
              />
            )}
            {activeTab === 'grammar' && (
              <GrammarPanel 
                userStats={userStats} 
                onUpdateStats={setUserStats} 
                onBackToDashboard={() => setActiveTab('dashboard')} 
              />
            )}
            {activeTab === 'speaking' && (
              <SpeakingPanel 
                userStats={userStats} 
                onUpdateStats={setUserStats} 
                onBackToDashboard={() => setActiveTab('dashboard')} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Compact Interactive navigation for mobile viewports */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full bg-[#ffffff]/95 backdrop-blur-md border-t border-[#e7e5e4] py-2 h-16 flex items-center justify-around z-45 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-20 h-12 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-[#1c1917] font-semibold bg-[#f5f5f4]' : 'text-[#78716c]'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium mt-1 uppercase tracking-wider">Överblick</span>
        </button>
        
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex flex-col items-center justify-center w-20 h-12 rounded-xl transition ${
            activeTab === 'grammar' ? 'text-[#1c1917] font-semibold bg-[#f5f5f4]' : 'text-[#78716c]'
          }`}
        >
          <GraduationCap className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium mt-1 uppercase tracking-wider">Grammatik</span>
        </button>

        <button
          onClick={() => setActiveTab('speaking')}
          className={`flex flex-col items-center justify-center w-20 h-12 rounded-xl transition ${
            activeTab === 'speaking' ? 'text-[#1c1917] font-semibold bg-[#f5f5f4]' : 'text-[#78716c]'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium mt-1 uppercase tracking-wider font-semibold">Tala</span>
        </button>
      </footer>
      
      {/* Bottom spacer for mobile footer navigation height */}
      <div className="h-16 md:hidden shrink-0" />
    </div>
  );
}
