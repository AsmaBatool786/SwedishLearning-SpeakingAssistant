import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, ExerciseCategory, UserStats } from '../types';
import { grammarExercises } from '../data/exercises';
import { CheckCircle2, AlertCircle, HelpCircle, Volume2, ArrowRight, RefreshCcw, Landmark, Trophy, ChevronRight } from 'lucide-react';

interface GrammarPanelProps {
  userStats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
  onBackToDashboard: () => void;
}

export default function GrammarPanel({ userStats, onUpdateStats, onBackToDashboard }: GrammarPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [wordOrderArr, setWordOrderArr] = useState<string[]>([]);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [aiGrammarExplanation, setAiGrammarExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Filter questions for the selected category
  const questionsList = selectedCategory
    ? grammarExercises.filter((q) => q.category === selectedCategory)
    : [];

  const currentQuestion = questionsList[currentQuestionIndex];

  // Text-to-Speech Helper using browser Web Speech API
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speaking first
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      // Find Swedish voice if available
      const voices = window.speechSynthesis.getVoices();
      const swedishVoice = voices.find((v) => v.lang.startsWith('sv'));
      if (swedishVoice) {
        utterance.voice = swedishVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start a category practice
  const startCategory = (category: ExerciseCategory) => {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setWordOrderArr([]);
    setRoundCompleted(false);
    setCorrectCount(0);
    setAiGrammarExplanation(null);
  };

  // Handle word order builder click
  const handleWordOrderClick = (word: string) => {
    if (isSubmitted) return;
    if (wordOrderArr.includes(word)) {
      setWordOrderArr(wordOrderArr.filter((w) => w !== word));
    } else {
      setWordOrderArr([...wordOrderArr, word]);
    }
  };

  // Submit Answer validation
  const handleSubmit = () => {
    if (!currentQuestion || isSubmitted) return;

    let isCorrect = false;

    if (currentQuestion.category === 'word-order') {
      const sentence = wordOrderArr.join(' ');
      isCorrect = sentence.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
      setSelectedOption(sentence);
    } else {
      isCorrect = selectedOption === currentQuestion.correctAnswer;
    }

    setIsCorrectAnswer(isCorrect);
    setIsSubmitted(true);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    // Auto speak correct answer in Swedish to help user absorb auditory patterns
    const qAny = currentQuestion as any;
    if (currentQuestion.category === 'en-ett') {
      speakText(`${currentQuestion.correctAnswer} ${qAny.word}`);
    } else if (currentQuestion.category === 'word-order') {
      speakText(currentQuestion.correctAnswer);
    } else if (currentQuestion.category === 'verbs') {
      const finalSentence = qAny.sentenceWithBlank.replace('______', currentQuestion.correctAnswer);
      speakText(finalSentence);
    } else {
      speakText(qAny.swedishPhrase || currentQuestion.correctAnswer);
    }
  };

  // Ask AI for custom grammar explanation if they want deep understanding
  const getAiGrammarDetails = async () => {
    if (!currentQuestion) return;
    setLoadingExplanation(true);
    setAiGrammarExplanation(null);
    try {
      const response = await fetch('/api/grammar/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: currentQuestion.category === 'en-ett' ? 'Noun Gender (En vs Ett)' : 
                 currentQuestion.category === 'verbs' ? 'Verb Conjugations' :
                 currentQuestion.category === 'word-order' ? 'SVOMPT & V2 Word Order rule' : 'Everyday phrases',
          context: currentQuestion.question + ' answer: ' + currentQuestion.correctAnswer,
        }),
      });
      const data = await response.json();
      setAiGrammarExplanation(data.explanation);
    } catch (e) {
      setAiGrammarExplanation('Could not connect to deep explanation server. Please check connection.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Go to next question or complete
  const handleNext = () => {
    setAiGrammarExplanation(null);
    if (currentQuestionIndex + 1 < questionsList.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setWordOrderArr([]);
    } else {
      // Calculate XP and update user statistics
      const xpEarned = correctCount * 15 + (correctCount === questionsList.length ? 30 : 0); // Bonus for 100%
      
      onUpdateStats((prev) => {
        // Collect vocabulary words from this exercise if user was correct
        const newVocab = [...prev.vocabLearned];
        
        questionsList.forEach((q: any, index) => {
          if (q.category === 'en-ett') {
            const label = `${q.correctAnswer} ${q.word}`;
            if (!newVocab.some(v => v.word.toLowerCase() === label.toLowerCase())) {
              newVocab.push({ word: label, translation: 'the ' + q.word.toLowerCase(), level: 'easy' });
            }
          } else if (q.category === 'vocab') {
            if (!newVocab.some(v => v.word.toLowerCase() === q.swedishPhrase.toLowerCase())) {
              newVocab.push({ word: q.swedishPhrase, translation: q.englishPhrase, level: 'easy' });
            }
          }
        });

        // Add completed questions so we don't repeat easily
        const updatedCompleted = [...prev.completedExercises];
        questionsList.forEach(q => {
          if (!updatedCompleted.includes(q.id)) {
            updatedCompleted.push(q.id);
          }
        });

        return {
          ...prev,
          xp: prev.xp + xpEarned,
          streak: prev.streak === 0 ? 1 : prev.streak, // ensure streak is initialized
          completedExercises: updatedCompleted,
          vocabLearned: newVocab
        };
      });

      setRoundCompleted(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" id="grammar-panel-container">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          // Category Selector Block
          <motion.div
            key="category-selector"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e2e8f0] pb-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1e293b] tracking-tight flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-blue-500" />
                  Svensk Grammatik (Swedish Grammar)
                </h2>
                <p className="text-xs text-[#64748b] mt-1">
                  Master natural sentence structures, noun genders, and verb inflections.
                </p>
              </div>
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 border border-[#e2e8f0] text-[#1e293b] rounded-xl hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
                id="back-to-dashboard-btn"
              >
                Tillbaka till översikt (Back)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Category 1: En vs Ett */}
              <div
                onClick={() => startCategory('en-ett')}
                className="p-6 border border-[#e2e8f0] rounded-2xl hover:border-blue-400 transition cursor-pointer bg-white group flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                id="category-en-ett-card"
              >
                <div className="space-y-2">
                  <div className="inline-flex py-0.5 px-2 bg-blue-50 text-blue-650 rounded-full text-[10px] font-semibold uppercase tracking-wider">Genus</div>
                  <h3 className="text-base font-semibold text-[#1e293b] group-hover:text-blue-600 transition flex items-center justify-between">
                    En or Ett? (Common vs Neuter)
                    <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    75% of Swedish nouns are "en-words". Train your gut feeling to master placing gender agreements for indefinite/definite adjectives.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-medium text-[#64748b]">
                  <span>6 dynamic questions</span>
                  <span>•</span>
                  <span>+15 XP per answer</span>
                </div>
              </div>

              {/* Category 2: Verb Conjugation */}
              <div
                onClick={() => startCategory('verbs')}
                className="p-6 border border-[#e2e8f0] rounded-2xl hover:border-blue-400 transition cursor-pointer bg-white group flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                id="category-verbs-card"
              >
                <div className="space-y-2">
                  <div className="inline-flex py-0.5 px-2 bg-blue-50 text-blue-650 rounded-full text-[10px] font-semibold uppercase tracking-wider">Verb</div>
                  <h3 className="text-base font-semibold text-[#1e293b] group-hover:text-amber-600 transition flex items-center justify-between">
                    Verb Conjugation (Verbböjning)
                    <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Practice conjugations from groups 1-4. Learn how past, present, and supine tenses represent everyday Swedish life sequences.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-medium text-[#64748b]">
                  <span>4 dynamic questions</span>
                  <span>•</span>
                  <span>+15 XP per answer</span>
                </div>
              </div>

              {/* Category 3: SVOMPT Word order */}
              <div
                onClick={() => startCategory('word-order')}
                className="p-6 border border-[#e2e8f0] rounded-2xl hover:border-blue-400 transition cursor-pointer bg-white group flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                id="category-word-order-card"
              >
                <div className="space-y-2">
                  <div className="inline-flex py-0.5 px-2 bg-blue-50 text-blue-650 rounded-full text-[10px] font-semibold uppercase tracking-wider">Syntas</div>
                  <h3 className="text-base font-semibold text-[#1e293b] group-hover:text-violet-600 transition flex items-center justify-between">
                    The V2 Word Order Rule (Ordföljd)
                    <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    In Swedish main clauses, the finite verb must ALWAYS be the second element. Reconstruct scrambled sentences to internalize Swedish structure.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-medium text-[#64748b]">
                  <span>3 dynamic questions</span>
                  <span>•</span>
                  <span>Interactive builder</span>
                </div>
              </div>

              {/* Category 4: Vocabulary Phrases */}
              <div
                onClick={() => startCategory('vocab')}
                className="p-6 border border-[#e2e8f0] rounded-2xl hover:border-blue-400 transition cursor-pointer bg-white group flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                id="category-vocab-card"
              >
                <div className="space-y-2">
                  <div className="inline-flex py-0.5 px-2 bg-blue-50 text-blue-650 rounded-full text-[10px] font-semibold uppercase tracking-wider">Fraser</div>
                  <h3 className="text-base font-semibold text-[#1e293b] group-hover:text-amber-600 transition flex items-center justify-between">
                    Daily Useful Phrases (Vardagliga fraser)
                    <ChevronRight className="w-4 h-4 text-[#64748b] group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Connect English prompts to Swedish conversational equivalents. Master polite, casual expressions needed to order fika or ask questions.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-medium text-[#64748b]">
                  <span>2 dynamic questions</span>
                  <span>•</span>
                  <span>Quick matching</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : roundCompleted ? (
          // Round Summary Completed Screen
          <motion.div
            key="round-summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-[#e2e8f0] rounded-3xl p-8 text-center space-y-6 max-w-lg mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
            id="round-completed-container"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Trophy className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[#1e293b]">Fantastiskt jobbat!</h2>
              <p className="text-xs text-[#64748b]">
                You have completed the <span className="font-semibold text-[#1e293b]">{selectedCategory === 'en-ett' ? 'En/Ett' : selectedCategory === 'verbs' ? 'Verb conjugation' : selectedCategory === 'word-order' ? 'Word Ordering' : 'Vocabulary'}</span> round!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-[#e2e8f0] py-6 my-4">
              <div className="text-center">
                <div className="text-xs text-[#64748b] font-medium">Accuracy Score</div>
                <div className="text-2xl font-bold text-blue-650 mt-1">
                  {Math.round((correctCount / questionsList.length) * 100)}%
                </div>
                <p className="text-[11px] text-[#64748b] mt-1">
                  {correctCount} / {questionsList.length} correct
                </p>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#64748b] font-medium">XP Reward</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  +{correctCount * 15 + (correctCount === questionsList.length ? 30 : 0)} XP
                </div>
                <p className="text-[11px] text-[#64748b] mt-1">
                  {correctCount === questionsList.length ? 'Includes 30 XP flawless bonus!' : 'Keep pushing for flawless bonus!'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => startCategory(selectedCategory)}
                className="flex-1 px-5 py-2.5 border border-[#e2e8f0] text-[#1e293b] font-medium rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 transition text-xs cursor-pointer"
                id="retry-round-btn"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Spela igen (Retry)
              </button>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex-1 px-5 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                id="back-to-categories-btn"
              >
                Fler övningar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          // Active Exercise Quiz screen
          <motion.div
            key="quiz-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-[#e2e8f0] shadow-[0_2px_12px_rgba(0,0,0,0.015)] rounded-3xl p-6 md:p-8 space-y-6"
            id="quiz-container"
          >
            {/* Header / Progress bar */}
            <div className="flex justify-between items-center text-xs font-semibold text-[#64748b] pb-2">
              <span className="capitalize text-blue-600 tracking-wider">
                Category: {selectedCategory === 'en-ett' ? 'En or Ett' : selectedCategory === 'verbs' ? 'Verbs' : selectedCategory === 'word-order' ? 'Syntas ordföljd' : 'Useful vocabulary'}
              </span>
              <span>
                Fråga {currentQuestionIndex + 1} av {questionsList.length}
              </span>
            </div>
            
            {/* Sizable active progress line */}
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex) / questionsList.length) * 100}%` }}
              />
            </div>

            {/* Question Label */}
            <div className="space-y-3 py-2 border-l-4 border-blue-500 bg-slate-50/60 p-6 rounded-2xl">
              <span className="pill self-start bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider">Svenska</span>
              <h3 className="text-lg font-semibold text-[#1e293b] tracking-tight leading-relaxed">
                {currentQuestion.question}
              </h3>
              {currentQuestion.hint && !isSubmitted && (
                <p className="text-xs text-[#64748b] flex items-center gap-1.5 italic pt-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <strong>Ledtråd (Hint):</strong> {currentQuestion.hint}
                </p>
              )}
            </div>

            {/* Quiz Body depending on Category */}
            <div className="py-2" id="quiz-question-body">
              {(() => {
                const q = currentQuestion as any;
                
                // Gender Selection (En vs Ett)
                if (q.category === 'en-ett') {
                  return (
                    <div className="flex flex-col items-center gap-6">
                      <div className="text-3xl font-semibold text-[#1e293b] tracking-tight select-none border border-[#e2e8f0] px-8 py-4 rounded-xl bg-slate-50/50">
                        {q.word}
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        {['en', 'ett'].map((opt) => {
                          const isSelected = selectedOption === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => !isSubmitted && setSelectedOption(opt)}
                              disabled={isSubmitted}
                              className={`py-4 text-sm font-semibold rounded-xl border uppercase tracking-wider transition cursor-pointer ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-[0_1px_2px_rgba(0,0,0,0.01)]'
                                  : 'border-[#e2e8f0] bg-white text-[#1e293b] hover:border-blue-300'
                              } disabled:opacity-85`}
                              id={`option-${opt}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Verb conjugation
                if (q.category === 'verbs') {
                  const parts = q.sentenceWithBlank.split('______');
                  return (
                    <div className="space-y-8">
                      <div className="text-base font-semibold text-[#1e293b] text-center leading-relaxed py-4 border-b border-[#e2e8f0]">
                        {parts[0]}
                        <span className="px-3.5 py-1 mx-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200">
                          {selectedOption || '_______'}
                        </span>
                        {parts[1]}
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 max-w-sm mx-auto">
                        {q.options?.map((opt) => {
                          const isSelected = selectedOption === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => !isSubmitted && setSelectedOption(opt)}
                              disabled={isSubmitted}
                              className={`p-3.5 border rounded-xl font-semibold transition text-center text-xs cursor-pointer ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/50 text-blue-755'
                                  : 'border-[#e2e8f0] bg-white text-[#1e293b] hover:border-blue-300'
                              } disabled:opacity-85`}
                              id={`verb-option-${opt}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                    // Word Order Reorder
                if (q.category === 'word-order') {
                  const unusedWords = q.scrambledWords.filter((w) => !wordOrderArr.includes(w));
                  return (
                    <div className="space-y-6">
                      {/* Active board */}
                      <div className="min-h-16 p-4 border border-[#e2e8f0] rounded-xl bg-slate-50/50 flex flex-wrap gap-2.5 items-center justify-center">
                        {wordOrderArr.map((word) => (
                          <button
                            key={word}
                            onClick={() => handleWordOrderClick(word)}
                            disabled={isSubmitted}
                            className="px-3.5 py-1.5 border border-blue-200 bg-blue-50 text-blue-850 font-semibold rounded-lg hover:bg-blue-100 transition cursor-pointer text-xs"
                          >
                            {word}
                          </button>
                        ))}
                        {wordOrderArr.length === 0 && (
                          <span className="text-[#64748b] font-medium select-none text-xs">
                            Click words below in correct chronological order
                          </span>
                        )}
                      </div>

                      {/* Scrambled Pool */}
                      <div className="flex flex-wrap gap-2 justify-center pt-2">
                        {q.scrambledWords.map((word) => {
                          const isUsed = wordOrderArr.includes(word);
                          return (
                            <button
                              key={word}
                              onClick={() => handleWordOrderClick(word)}
                              disabled={isSubmitted || isUsed}
                              className={`px-3.5 py-1.5 border rounded-lg font-medium transition cursor-pointer text-xs ${
                                isUsed
                                  ? 'border-slate-100 bg-slate-100 text-slate-350 cursor-not-allowed opacity-40'
                                  : 'border-[#e2e8f0] bg-white text-[#1e293b] hover:border-blue-400'
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>

                      {/* Reset tools */}
                      {!isSubmitted && wordOrderArr.length > 0 && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => setWordOrderArr([])}
                            className="px-3.5 py-1.5 border border-[#e2e8f0] text-red-650 bg-red-50 hover:bg-red-100/70 text-xs font-semibold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" /> Återställ (Reset Sentence)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // Daily Vocabulary select
                if (q.category === 'vocab') {
                  return (
                    <div className="space-y-6">
                      <div className="text-center space-y-1">
                        <span className="text-xs font-semibold tracking-wider text-[#64748b] uppercase">English Statement</span>
                        <div className="text-xl font-semibold text-[#1e293b] mt-1">{q.englishPhrase}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                        {q.options?.map((opt) => {
                          const isSelected = selectedOption === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => !isSubmitted && setSelectedOption(opt)}
                              disabled={isSubmitted}
                              className={`p-4 border rounded-xl font-medium transition text-left flex items-center justify-between text-xs cursor-pointer ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/50 text-blue-755'
                                  : 'border-[#e2e8f0] bg-white text-[#1e293b] hover:border-blue-300'
                              } disabled:opacity-85`}
                              id={`vocab-option-${opt}`}
                            >
                              {opt}
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }                }
              })()}
            </div>

            {/* Validation Banner Area */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between gap-4 ${
                    isCorrectAnswer
                      ? 'border-emerald-250 bg-emerald-50 text-emerald-900'
                      : 'border-red-250 bg-red-50 text-red-900'
                  }`}
                  id="exercise-feedback-banner"
                >
                  <div className="flex gap-3">
                    {isCorrectAnswer ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold flex items-center gap-1.5">
                        {isCorrectAnswer ? 'Helt rätt! (Correct!)' : 'Oj, det blev fel. (Oops, incorrect)'}
                        <button
                          onClick={() => {
                            if (currentQuestion.category === 'en-ett') {
                              speakText(currentQuestion.correctAnswer + ' ' + (currentQuestion as any).word);
                            } else {
                              speakText(currentQuestion.correctAnswer);
                            }
                          }}
                          className="p-1 hover:bg-black/5 rounded-md transition text-gray-500 hover:text-gray-900"
                          title="Lyssna på uttalet (Listen to Swedish)"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </h4>
                      <p className="text-sm mt-1 leading-relaxed opacity-90">
                        {currentQuestion.explanation}
                      </p>
                      
                      {!isCorrectAnswer && (
                        <p className="text-sm font-semibold mt-2">
                          💡 Korrekt svar:{' '}
                          <span className="font-black underline decoration-2">
                            {currentQuestion.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ask AI for deeper rule explanation */}
                  <div className="flex flex-col justify-end items-end min-w-44 self-stretch border-t md:border-t-0 md:border-l border-black/10 pt-3 md:pt-0 md:pl-4">
                    {!aiGrammarExplanation ? (
                      <button
                        onClick={getAiGrammarDetails}
                        disabled={loadingExplanation}
                        className="px-3.5 py-2 text-xs font-bold border border-black/10 bg-white/40 hover:bg-white rounded-lg transition disabled:opacity-50 text-gray-700 cursor-pointer w-full text-center"
                      >
                        {loadingExplanation ? 'Ansluter AI...' : 'Förklara mer (AI rule)'}
                      </button>
                    ) : (
                      <div className="text-xs text-left text-gray-700 leading-relaxed max-w-sm mt-1 bg-white/80 p-3 rounded-lg border border-black/5 w-full font-sans">
                        <h5 className="font-bold border-b border-gray-100 pb-1 mb-1 text-blue-600">AI Grammatik Coach:</h5>
                        <p className="whitespace-pre-line text-[11px]">{aiGrammarExplanation}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Controls panel */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-5">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                id="quit-exercise-btn"
              >
                Avbryt (Quit Session)
              </button>

              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={
                    currentQuestion.category === 'word-order'
                      ? wordOrderArr.length === 0
                      : !selectedOption
                  }
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-xs transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                  id="submit-exercise-btn"
                >
                  Kontrollera svar (Submit) <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  id="next-exercise-btn"
                >
                  {currentQuestionIndex + 1 === questionsList.length ? 'Visa resultat (Finish)' : 'Nästa fråga (Next)'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
