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
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-blue-100 flex flex-col" id="swedish-app-frame">
      {/* Visual Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e2e8f0] backdrop-blur-sm bg-white/95 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition select-none"
            id="brand-logo-trigger"
          >
            <div className="text-2xl shrink-0 p-1.5 bg-slate-50 border border-slate-100 rounded-xl">🇸🇪</div>
            <div>
              <h1 className="font-semibold text-[#1e293b] leading-tight text-base tracking-tight flex items-center gap-1.5">
                LingoSvenska
              </h1>
              <p className="text-[10px] text-[#64748b] font-medium tracking-wide mt-0.5">Swedish Learning Hub</p>
            </div>
          </div>

          {/* Center Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-1.5" id="desktop-nav-links">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-[#64748b] hover:text-[#1e293b] hover:bg-slate-50'
              }`}
            >
              Overblick (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'grammar'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-[#64748b] hover:text-[#1e293b] hover:bg-slate-50'
              }`}
            >
              Grammar Bank
            </button>
            <button
              onClick={() => setActiveTab('speaking')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'speaking'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-[#64748b] hover:text-[#1e293b] hover:bg-slate-50'
              }`}
            >
              Speech Lab
            </button>
          </nav>

          {/* Quick Metrics display info */}
          <div className="flex items-center gap-2.5" id="header-metrics-capsules">
            {/* Streak capsule */}
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-100/60">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-50" />
              <span>{userStats.streak} day streak</span>
            </div>

            {/* XP Level capsule */}
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-100/60">
              <Award className="w-3.5 h-3.5 text-blue-500" />
              <span>{userStats.xp} XP</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
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
      <footer className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-150 py-2 h-14 flex items-center justify-around z-40 shadow-md">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-1 uppercase">Dashboard</span>
        </button>
        
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'grammar' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <GraduationCap className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-1 uppercase">Grammatik</span>
        </button>

        <button
          onClick={() => setActiveTab('speaking')}
          className={`flex flex-col items-center cursor-pointer ${
            activeTab === 'speaking' ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-1 uppercase">Tala</span>
        </button>
      </footer>
      
      {/* Bottom spacer for mobile footer navigation height */}
      <div className="h-14 md:hidden shrink-0" />
    </div>
  );
}
