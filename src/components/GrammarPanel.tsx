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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
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

  // Ask AI for custom grammar explanation
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
      const xpEarned = correctCount * 15 + (correctCount === questionsList.length ? 30 : 0);
      
      onUpdateStats((prev) => {
        const newVocab = [...prev.vocabLearned];
        
        questionsList.forEach((q: any) => {
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

        const updatedCompleted = [...prev.completedExercises];
        questionsList.forEach(q => {
          if (!updatedCompleted.includes(q.id)) {
            updatedCompleted.push(q.id);
          }
        });

        return {
          ...prev,
          xp: prev.xp + xpEarned,
          streak: prev.streak === 0 ? 1 : prev.streak,
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
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e7e5e4] pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[#1c1917] tracking-tight flex items-center gap-3">
                  <Landmark className="w-6 h-6 text-[#166534]" />
                  Svensk Grammatik (Swedish Grammar)
                </h2>
                <p className="text-xs text-[#57534e] max-w-xl">
                  Master natural sentence structures, noun genders (En vs Ett), and verb conjugations with immediate AI-backed guidance.
                </p>
              </div>
              <button
                onClick={onBackToDashboard}
                className="px-4.5 py-2.5 border border-[#e7e5e4] bg-[#ffffff] text-[#1c1917] rounded-xl hover:bg-[#f5f5f4] text-xs font-semibold transition-all cursor-pointer scandi-shadow-sm active:scale-98"
                id="back-to-dashboard-btn"
              >
                Tillbaka till översikt (Back)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {/* Category 1: En vs Ett */}
              <div
                onClick={() => startCategory('en-ett')}
                className="p-6 border border-[#e7e5e4] rounded-2xl hover:border-[#1c1917] hover:shadow-md transition-all duration-150 cursor-pointer bg-[#ffffff] group flex flex-col justify-between scandi-shadow-sm"
                id="category-en-ett-card"
              >
                <div className="space-y-3">
                  <div className="inline-flex py-0.5 px-2 bg-[#f0fdf4] text-[#166534] border border-[#dcfce7] rounded-full text-[10px] font-bold uppercase tracking-wider">GENUS</div>
                  <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#166534] transition flex items-center justify-between">
                    En or Ett? (Common vs Neuter)
                    <ChevronRight className="w-4 h-4 text-[#78716c] group-hover:text-[#1c1917] group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    75% of Swedish nouns are "en-words". Train your gut feeling to master placing gender agreements for indefinite/definite adjectives.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-[#78716c] tracking-wider uppercase border-t border-[#f5f5f4] pt-3">
                  <span>6 dynamic questions</span>
                  <span>•</span>
                  <span className="text-[#166534]">+15 XP per answer</span>
                </div>
              </div>

              {/* Category 2: Verb Conjugation */}
              <div
                onClick={() => startCategory('verbs')}
                className="p-6 border border-[#e7e5e4] rounded-2xl hover:border-[#1c1917] hover:shadow-md transition-all duration-150 cursor-pointer bg-[#ffffff] group flex flex-col justify-between scandi-shadow-sm"
                id="category-verbs-card"
              >
                <div className="space-y-3">
                  <div className="inline-flex py-0.5 px-2 bg-[#fffbeb] text-[#92400e] border border-[#fde68a] rounded-full text-[10px] font-bold uppercase tracking-wider">VERB</div>
                  <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#92400e] transition flex items-center justify-between">
                    Verb Conjugation (Verbböjning)
                    <ChevronRight className="w-4 h-4 text-[#78716c] group-hover:text-[#1c1917] group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Practice conjugations from groups 1-4. Learn how past, present, and supine tenses represent everyday Swedish life sequences.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-[#78716c] tracking-wider uppercase border-t border-[#f5f5f4] pt-3">
                  <span>4 dynamic questions</span>
                  <span>•</span>
                  <span className="text-[#92400e]">+15 XP per answer</span>
                </div>
              </div>

              {/* Category 3: SVOMPT Word order */}
              <div
                onClick={() => startCategory('word-order')}
                className="p-6 border border-[#e7e5e4] rounded-2xl hover:border-[#1c1917] hover:shadow-md transition-all duration-150 cursor-pointer bg-[#ffffff] group flex flex-col justify-between scandi-shadow-sm"
                id="category-word-order-card"
              >
                <div className="space-y-3">
                  <div className="inline-flex py-0.5 px-2 bg-[#faf5ff] text-[#6b21a8] border border-[#f3e8ff] rounded-full text-[10px] font-bold uppercase tracking-wider">SYNTAS</div>
                  <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#6b21a8] transition flex items-center justify-between">
                    The V2 Word Order Rule (Ordföljd)
                    <ChevronRight className="w-4 h-4 text-[#78716c] group-hover:text-[#1c1917] group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    In Swedish main clauses, the finite verb must ALWAYS be the second element. Reconstruct scrambled sentences to internalize Swedish structure.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-[#78716c] tracking-wider uppercase border-t border-[#f5f5f4] pt-3">
                  <span>3 dynamic questions</span>
                  <span>•</span>
                  <span className="text-[#6b21a8]">Interactive builder</span>
                </div>
              </div>

              {/* Category 4: Vocabulary Phrases */}
              <div
                onClick={() => startCategory('vocab')}
                className="p-6 border border-[#e7e5e4] rounded-2xl hover:border-[#1c1917] hover:shadow-md transition-all duration-150 cursor-pointer bg-[#ffffff] group flex flex-col justify-between scandi-shadow-sm"
                id="category-vocab-card"
              >
                <div className="space-y-3">
                  <div className="inline-flex py-0.5 px-2 bg-[#fafaf9] text-[#292524] border border-[#e7e5e4] rounded-full text-[10px] font-bold uppercase tracking-wider">FRASER</div>
                  <h3 className="text-base font-bold text-[#1c1917] group-hover:text-[#292524] transition flex items-center justify-between">
                    Daily Useful Phrases (Vardagliga fraser)
                    <ChevronRight className="w-4 h-4 text-[#78716c] group-hover:text-[#1c1917] group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Connect English prompts to Swedish conversational equivalents. Master polite, casual expressions needed to order fika or ask questions.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-[#78716c] tracking-wider uppercase border-t border-[#f5f5f4] pt-3">
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
            className="bg-[#ffffff] border border-[#e7e5e4] rounded-3xl p-8 md:p-10 text-center space-y-6 max-w-lg mx-auto scandi-shadow-lg"
            id="round-completed-container"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[#faf9f5] border border-[#e7e5e4] rounded-full flex items-center justify-center text-[#d97706] shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[#1c1917]">Fantastiskt jobbat!</h2>
              <p className="text-xs text-[#57534e]">
                You have completed the <span className="font-bold text-[#1c1917]">{selectedCategory === 'en-ett' ? 'En/Ett' : selectedCategory === 'verbs' ? 'Verb conjugation' : selectedCategory === 'word-order' ? 'Word Ordering' : 'Vocabulary'}</span> round!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-[#e7e5e4] py-6 my-4">
              <div className="text-center">
                <div className="text-[10px] text-[#78716c] font-bold uppercase tracking-wider">Accuracy Score</div>
                <div className="text-3xl font-extrabold text-[#166534] mt-1.5">
                  {Math.round((correctCount / questionsList.length) * 100)}%
                </div>
                <p className="text-[11px] text-[#78716c] mt-1">
                  {correctCount} / {questionsList.length} correct
                </p>
              </div>
              <div className="text-center border-l border-[#e7e5e4]">
                <div className="text-[10px] text-[#78716c] font-bold uppercase tracking-wider">XP Reward</div>
                <div className="text-3xl font-extrabold text-[#d97706] mt-1.5">
                  +{correctCount * 15 + (correctCount === questionsList.length ? 15 : 0)} XP
                </div>
                <p className="text-[11px] text-[#78716c] mt-1">
                  {correctCount === questionsList.length ? 'Perfect score bonus included!' : 'Excellent effort!'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => startCategory(selectedCategory)}
                className="flex-1 px-5 py-3 border border-[#e7e5e4] text-[#1c1917] font-bold rounded-xl hover:bg-[#f5f5f4] flex items-center justify-center gap-2 transition text-xs cursor-pointer active:scale-98 shadow-sm"
                id="retry-round-btn"
              >
                <RefreshCcw className="w-4 h-4" /> Spela igen (Retry)
              </button>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex-1 px-5 py-3 bg-[#1c1917] hover:bg-[#292524] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer active:scale-98 shadow-sm"
                id="back-to-categories-btn"
              >
                Fler övningar <ArrowRight className="w-4 h-4" />
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
            className="bg-[#ffffff] border border-[#e7e5e4] scandi-shadow-lg rounded-3xl p-6 md:p-8 space-y-6"
            id="quiz-container"
          >
            {/* Header / Progress bar */}
            <div className="flex justify-between items-center text-xs font-bold text-[#78716c] pb-2">
              <span className="capitalize text-[#1c1917] tracking-widest uppercase text-[10px]">
                CATEGORY: {selectedCategory === 'en-ett' ? 'En or Ett' : selectedCategory === 'verbs' ? 'Verbs' : selectedCategory === 'word-order' ? 'Syntas ordföljd' : 'Useful vocabulary'}
              </span>
              <span className="tabular-nums">
                Fråga {currentQuestionIndex + 1} av {questionsList.length}
              </span>
            </div>
            
            {/* Sizable active progress line */}
            <div className="w-full bg-[#f5f5f4] h-1.5 rounded-full overflow-hidden border border-[#e7e5e4]/50">
              <div 
                className="bg-[#1c1917] h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex) / questionsList.length) * 100}%` }}
              />
            </div>

            {/* Question Label */}
            <div className="space-y-4 py-1.5 border-l-4 border-[#166534] bg-[#faf9f6] p-6 rounded-2xl border border-[#e7e5e4]">
              <span className="self-start bg-[#e7e5e4] text-[#1c1917] px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">SVENSKA</span>
              <h3 className="text-lg md:text-xl font-extrabold text-[#1c1917] tracking-tight leading-relaxed">
                {currentQuestion.question}
              </h3>
              {currentQuestion.hint && !isSubmitted && (
                <p className="text-xs text-[#57534e] flex items-center gap-1.5 italic pt-1 border-t border-[#e7e5e4]/50 mt-2">
                  <HelpCircle className="w-4 h-4 text-[#d97706] shrink-0" />
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
                      <div className="text-3xl font-extrabold text-[#1c1917] tracking-tight select-none border border-[#e7e5e4] px-10 py-5 rounded-2xl bg-[#faf9f6] scandi-shadow-sm font-sans">
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
                              className={`py-4 text-sm font-bold rounded-xl border uppercase tracking-widest transition cursor-pointer active:scale-98 ${
                                isSelected
                                  ? 'border-[#1c1917] bg-[#1c1917] text-[#fcfbf9] shadow-sm'
                                  : 'border-[#e7e5e4] bg-[#ffffff] text-[#1c1917] hover:border-[#1c1917]'
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
                      <div className="text-base font-bold text-[#1c1917] text-center leading-relaxed py-6 border-b border-[#e7e5e4]">
                        {parts[0]}
                        <span className="px-3.5 py-1.5 mx-1.5 bg-[#f0fdf4] text-[#166534] font-bold rounded-xl border border-[#dcfce7] inline-block shadow-sm">
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
                              className={`p-3.5 border rounded-xl font-bold transition text-center text-xs cursor-pointer active:scale-98 ${
                                isSelected
                                  ? 'border-[#1c1917] bg-[#1c1917] text-white shadow-sm'
                                  : 'border-[#e7e5e4] bg-white text-[#1c1917] hover:border-[#1c1917]'
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
                }

                // Word Order Reorder
                if (q.category === 'word-order') {
                  const unusedWords = q.scrambledWords.filter((w) => !wordOrderArr.includes(w));
                  return (
                    <div className="space-y-6">
                      {/* Active board */}
                      <div className="min-h-[70px] p-5 border border-[#e7e5e4] rounded-2xl bg-[#faf9f6] flex flex-wrap gap-2.5 items-center justify-center shadow-inner">
                        {wordOrderArr.map((word) => (
                          <button
                            key={word}
                            onClick={() => handleWordOrderClick(word)}
                            disabled={isSubmitted}
                            className="px-3.5 py-2 border border-[#ccfbf1] bg-[#f0fdfa] text-[#0f766e] font-bold rounded-lg hover:bg-neutral-100 transition cursor-pointer text-xs"
                          >
                            {word}
                          </button>
                        ))}
                        {wordOrderArr.length === 0 && (
                          <span className="text-[#a8a29e] font-semibold select-none text-xs">
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
                              className={`px-3.5 py-2 border rounded-lg font-bold transition cursor-pointer text-xs ${
                                isUsed
                                  ? 'border-[#f5f5f4] bg-[#f5f5f4] text-[#d6d3d1] cursor-not-allowed opacity-40'
                                  : 'border-[#e7e5e4] bg-white text-[#1c1917] hover:border-[#1c1917] shadow-xs'
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
                            className="px-4 py-2 border border-[#e7e5e4] text-red-700 bg-red-50 hover:bg-red-100/70 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
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
                        <span className="text-[10px] font-bold tracking-wider text-[#78716c] uppercase">English Statement</span>
                        <div className="text-xl font-extrabold text-[#1c1917] mt-1">{q.englishPhrase}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                        {q.options?.map((opt) => {
                          const isSelected = selectedOption === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => !isSubmitted && setSelectedOption(opt)}
                              disabled={isSubmitted}
                              className={`p-4 border rounded-xl font-bold transition text-left flex items-center justify-between text-xs cursor-pointer active:scale-98 ${
                                isSelected
                                  ? 'border-[#1c1917] bg-[#1c1917] text-white shadow-xs'
                                  : 'border-[#e7e5e4] bg-white text-[#1c1917] hover:border-[#1c1917]'
                              } disabled:opacity-85`}
                              id={`vocab-option-${opt}`}
                            >
                              {opt}
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Validation Banner Area */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between gap-5 ${
                    isCorrectAnswer
                      ? 'border-[#dcfce7] bg-[#f0fdf4] text-[#166534]'
                      : 'border-[#fca5a5] bg-[#fff5f5] text-[#991b1b]'
                  }`}
                  id="exercise-feedback-banner"
                >
                  <div className="flex gap-3">
                    {isCorrectAnswer ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-[#ef4444] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {isCorrectAnswer ? 'Helt rätt! (Correct!)' : 'Oj, det blev fel. (Oops, incorrect)'}
                        <button
                          onClick={() => {
                            if (currentQuestion.category === 'en-ett') {
                              speakText(currentQuestion.correctAnswer + ' ' + (currentQuestion as any).word);
                            } else {
                              speakText(currentQuestion.correctAnswer);
                            }
                          }}
                          className="p-1 px-1.5 hover:bg-[#1c1917]/5 rounded-lg transition text-[#1c1917] flex items-center"
                          title="Lyssna på uttalet (Listen to Swedish)"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </h4>
                      <p className="text-xs md:text-sm mt-1.5 leading-relaxed opacity-95">
                        {currentQuestion.explanation}
                      </p>
                      
                      {!isCorrectAnswer && (
                        <p className="text-xs md:text-sm font-extrabold mt-3.5">
                          💡 Korrekt svar:{' '}
                          <span className="font-black underline decoration-2">
                            {currentQuestion.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ask AI for deeper rule explanation */}
                  <div className="flex flex-col justify-end items-end min-w-[210px] self-stretch border-t md:border-t-0 md:border-l border-[#e7e5e4] pt-3.5 md:pt-0 md:pl-5">
                    {!aiGrammarExplanation ? (
                      <button
                        onClick={getAiGrammarDetails}
                        disabled={loadingExplanation}
                        className="px-4 py-2.5 text-xs font-bold border border-[#e7e5e4] bg-white hover:border-[#1c1917] rounded-xl transition disabled:opacity-50 text-[#1c1917] cursor-pointer w-full text-center shadow-xs"
                      >
                        {loadingExplanation ? 'Ansluter AI...' : 'Förklara mer (AI rule)'}
                      </button>
                    ) : (
                      <div className="text-xs text-left text-stone-800 leading-relaxed max-w-sm mt-1 bg-[#ffffff] p-4 rounded-xl border border-stone-200 w-full font-sans shadow-sm">
                        <h5 className="font-bold border-b border-[#e7e5e4] pb-1.5 mb-1.5 text-[#166534]">AI Grammatik Coach:</h5>
                        <p className="whitespace-pre-line text-[11px] leading-relaxed font-semibold">{aiGrammarExplanation}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Controls panel */}
            <div className="flex justify-between items-center border-t border-[#e7e5e4] pt-5">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 text-xs font-bold text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f5f4] rounded-lg transition cursor-pointer"
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
                  className="px-6 py-3 bg-[#1c1917] text-white font-bold rounded-xl hover:bg-[#292524] hover:shadow-sm transition disabled:bg-[#f5f5f4] disabled:text-[#a8a29e] disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 text-xs"
                  id="submit-exercise-btn"
                >
                  Kontrollera svar (Submit) <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#166534] text-white font-bold rounded-xl hover:bg-[#14532d] transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
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
