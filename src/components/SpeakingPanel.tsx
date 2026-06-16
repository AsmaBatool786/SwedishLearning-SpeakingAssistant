import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeScenario, ChatMessage, UserStats } from '../types';
import { practiceScenarios } from '../data/exercises';
import { 
  Coffee, MapPin, ShoppingBag, MessageSquare, Briefcase, Mic, MicOff, Send, Volume2, 
  Sparkles, CheckCircle2, ChevronRight, XCircle, AlertCircle, ArrowLeft, RotateCcw, Plus,
  GraduationCap, Landmark, Stethoscope, Pill, Home
} from 'lucide-react';

interface SpeakingPanelProps {
  userStats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
  onBackToDashboard: () => void;
}

export default function SpeakingPanel({ userStats, onUpdateStats, onBackToDashboard }: SpeakingPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showTranslations, setShowTranslations] = useState<{ [key: string]: boolean }>({});
  
  // Ref for auto-scroll to the bottom of the chat container
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Custom Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  // Initialize browser Speech Synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Text-To-Speech (TTS) synthesizer in Swedish
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

  // Safe initialize speech recognition constructor
  useEffect(() => {
    const BrowserSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (BrowserSpeechRecognition) {
      const rec = new BrowserSpeechRecognition();
      rec.continuous = false;
      rec.lang = 'sv-SE';
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
        setRecognitionError(null);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Permission to use microphone is denied or unavailable in iframe. Please ensure microphone permissions are granted or switch to manual typing.');
        } else if (event.error === 'no-speech') {
          setRecognitionError('No Swedish speech was detected. Please try speaking clearly.');
        } else {
          setRecognitionError(`Recognition returned: ${event.error}. Feel free to use standard typing input!`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserInput(transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Scroll to bottom whenever chats alter
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiLoading]);

  // Start micro-recording session
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setRecognitionError('Speech recognition is not natively supported or enabled in this browser. Please type your Swedish phrases directly.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Boot scenario chat setup
  const handleStartScenario = (scenario: PracticeScenario) => {
    setSelectedScenario(scenario);
    setChatHistory([
      {
        id: 'initial',
        role: 'assistant',
        content: scenario.initialAiGreeting,
        translation: getInitialTranslation(scenario.id),
      }
    ]);
    setUserInput('');
    setIsRecording(false);
    setRecognitionError(null);
    speakText(scenario.initialAiGreeting);
  };

  // Hardcode short translations for initial scenario titles to start cleanly offline
  const getInitialTranslation = (scenId: string): string => {
    if (scenId === 'cafe') return 'Hello and welcome to the cafe Kaffestugan! What would you like to order today?';
    if (scenId === 'directions') return 'Hello! You look a bit lost. Can I help you find somewhere?';
    if (scenId === 'grocery') return 'Hello! Do you need help finding anything in the shop today?';
    if (scenId === 'school') return "Welcome to the classroom! Are you ready for today's Swedish lesson?";
    if (scenId === 'doctor') return 'Welcome to the health clinic. What symptoms do you have that we should look at today?';
    if (scenId === 'pharmacy') return 'Welcome to the pharmacy Hjärtat! Would you like to pick up a prescription or are you looking for over-the-counter products?';
    if (scenId === 'bank') return 'Welcome to the bank branch. What financial matters can I help you with today?';
    if (scenId === 'smalltalk') return 'Hello colleague! Great to see you' + ' at the coffee machine. How has your week been so far?';
    if (scenId === 'renting') return 'Hello! Nice that you are interested in my apartment in Solna. Can you tell me a bit about your occupation and who you will live with?';
    return 'Welcome to the interview! Nice that you want to work with us at NordTech. Can you start by telling us a bit about yourself in Swedish?';
  };

  // Submit User utterance and send to Server Gemini API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isAiLoading || !selectedScenario) return;

    const userMsgText = userInput.trim();
    setUserInput('');
    setRecognitionError(null);

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMsgText,
    };

    setChatHistory((prev) => [...prev, newUserMessage]);
    setIsAiLoading(true);

    try {
      // Gather relevant sequence of chat messages for the API context
      const simplifiedMessages = [...chatHistory, newUserMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/practice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          scenarioTitle: selectedScenario.title,
          scenarioGreeting: selectedScenario.initialAiGreeting,
          messages: simplifiedMessages,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error. Make sure your secrets include a valid GEMINI_API_KEY!');
      }

      const aiData = await res.json();

      // Update previous user message with AI's grammar correction & evaluation feedback
      setChatHistory((prev) => {
        const updated = [...prev];
        let lastUserIdx = -1;
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'user') {
            lastUserIdx = i;
            break;
          }
        }
        if (lastUserIdx !== -1) {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            feedback: {
              correctedSwedish: aiData.userSwedishCorrection || undefined,
              hasErrors: aiData.userHasErrors,
              explanation: aiData.userFeedbackExplanation,
              vocabTips: aiData.vocabTips,
            }
          };
        }
        return updated;
      });

      // Appending the AI's Swedish Response
      const newAiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiData.aiSwedishResponse,
        translation: aiData.aiEnglishTranslation,
      };

      setChatHistory((prev) => [...prev, newAiMessage]);

      // Speak AI response automatically to preserve auditory loop
      speakText(aiData.aiSwedishResponse);

      // Track stats: Increment practice conversations
      onUpdateStats((prev) => {
        // Collect new vocabulary words to vocabulary lists
        const freshVocab = [...prev.vocabLearned];
        if (aiData.vocabTips && Array.isArray(aiData.vocabTips)) {
          aiData.vocabTips.forEach((tip: any) => {
            if (!freshVocab.some((v) => v.word.toLowerCase() === tip.Swedish.toLowerCase())) {
              freshVocab.push({
                word: tip.Swedish,
                translation: tip.English,
                pronunciationHint: tip.definition,
                level: selectedScenario.difficulty === 'B1' || selectedScenario.difficulty === 'B2' ? 'medium' : 'easy',
              });
            }
          });
        }

        return {
          ...prev,
          conversationsCount: prev.conversationsCount + 1,
          xp: prev.xp + 25, // Reward 25 XP per conversational exchange
          vocabLearned: freshVocab,
        };
      });

    } catch (err: any) {
      console.error('Error in talking with Swedish AI coach:', err);
      // Fallback message indicating API key required or general connection problem
      const errorMsgDetails = err.message || 'Please confirm your Secrets panel in the editor is setup and the server is restarted.';
      
      setChatHistory((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'Det verkar vara problem med anslutningen till AI-läraren. (Vänligen verifiera att din GEMINI_API_KEY är tilldelad i Secrets!)',
          translation: `An error occurred: ${errorMsgDetails}. Please ensure your API secrets are configured correctly.`,
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle English translation visibility on a bubble
  const toggleTranslation = (id: string) => {
    setShowTranslations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Render icons corresponding to scenario
  const renderScenarioIcon = (id: string, className = "w-6 h-6 text-blue-600") => {
    switch (id) {
      case 'cafe': return <Coffee className={className} />;
      case 'directions': return <MapPin className={className} />;
      case 'grocery': return <ShoppingBag className={className} />;
      case 'school': return <GraduationCap className={className} />;
      case 'doctor': return <Stethoscope className={className} />;
      case 'pharmacy': return <Pill className={className} />;
      case 'bank': return <Landmark className={className} />;
      case 'smalltalk': return <MessageSquare className={className} />;
      case 'renting': return <Home className={className} />;
      case 'job-interview': return <Briefcase className={className} />;
      default: return <MessageSquare className={className} />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto" id="speaking-panel-root">
      <AnimatePresence mode="wait">
        {!selectedScenario ? (
          // Scenarios list Screen
          <motion.div
            key="scenarios-list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e7e5e4] pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[#1c1917] tracking-tight flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-[#d97706]" />
                  AI Röst- & Samtalsträning (Speaking Practice)
                </h2>
                <p className="text-xs text-[#57534e] max-w-xl">
                  Connect to your virtual Swedish mentor to practice speech recognition, fika transactions, school routines, bank consultations, or job interviews.
                </p>
              </div>
              <button
                onClick={onBackToDashboard}
                className="px-4.5 py-2.5 border border-[#e7e5e4] bg-[#ffffff] text-[#1c1917] rounded-xl hover:bg-[#f5f5f4] text-xs font-semibold transition-all cursor-pointer scandi-shadow-sm active:scale-98"
              >
                Tillbaka till översikt (Back)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {practiceScenarios.map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => handleStartScenario(scen)}
                  className="p-6 border border-[#e7e5e4] rounded-2xl bg-[#ffffff] scandi-shadow-sm hover:border-[#1c1917] hover:shadow-md cursor-pointer transition-all duration-150 flex gap-4 md:items-start group"
                  id={`scenario-card-${scen.id}`}
                >
                  <div className="p-3 bg-[#f5f5f4] rounded-2xl group-hover:bg-[#1c1917] group-hover:text-[#fcfbf9] transition-all duration-200 self-start shrink-0 text-[#1c1917] border border-[#e7e5e4]">
                    {renderScenarioIcon(scen.id, "w-5.5 h-5.5 ")}
                  </div>
                  
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-wider border ${
                        scen.difficulty.startsWith('A') 
                          ? 'bg-[#f0fdf4] text-[#166534] border-[#dcfce7]' 
                          : 'bg-[#fffbeb] text-[#92400e] border-[#fef3c7]'
                      }`}>
                        Svenska {scen.difficulty}
                      </span>
                      <span className="text-[10px] font-bold text-[#78716c] group-hover:text-[#1c1917] transition-all flex items-center tracking-widest">
                        BÖRJA <ChevronRight className="w-3.5 h-3.5 ml-0.5 transform group-hover:translate-x-0.5 transition" />
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1c1917] leading-tight group-hover:text-[#166534] transition">
                      {scen.title}
                    </h3>
                    <p className="text-xs text-[#57534e] leading-relaxed">
                      {scen.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          // Active Chat Scenario Screen
          <motion.div
            key="active-chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            id="chat-active-playground"
          >
            {/* Left: Chat workspace (Takes 2 fractions on Desktop) */}
            <div className="lg:col-span-2 flex flex-col bg-[#ffffff] border border-[#e7e5e4] rounded-3xl overflow-hidden h-[600px] scandi-shadow-lg">
              
              {/* Chat Header */}
              <div className="bg-[#faf9f5] border-b border-[#e7e5e4] px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedScenario(null)}
                    className="p-2 hover:bg-[#e7e5e4] text-[#57534e] hover:text-[#1c1917] rounded-xl transition cursor-pointer active:scale-95 border border-transparent hover:border-[#d6d3d1]"
                    title="Change Scenario"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                  <div className="p-2 bg-[#ffffff] border border-[#e7e5e4] rounded-xl shrink-0">
                    {renderScenarioIcon(selectedScenario.id, "w-4.5 h-4.5 text-[#1c1917]")}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1c1917] leading-none">{selectedScenario.title}</h3>
                    <p className="text-[10px] font-semibold text-[#78716c] mt-1.5">Difficulty {selectedScenario.difficulty} • AI Coach</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartScenario(selectedScenario)}
                    className="p-2 px-3 border border-[#e7e5e4] hover:border-[#1c1917] hover:bg-[#ffffff] rounded-xl transition text-[#1c1917] cursor-pointer text-[11px] font-bold inline-flex items-center gap-1.5 bg-[#f5f5f4]"
                    title="Nollställ samtal (Reset chat)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Återställ
                  </button>
                </div>
              </div>

              {/* Chat Content Messages area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-[#fbfbfa]" id="chat-messages-scrollarea">
                {chatHistory.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isErr = msg.id.startsWith('ai-err-');

                  return (
                    <div key={msg.id} className="space-y-2">
                      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {/* Audio and text wrapper */}
                        <div className={`flex gap-2.5 max-w-[85%] items-end ${isUser ? 'flex-row-reverse' : ''}`}>
                          
                          {/* Chat bubble itself */}
                          <div className={`p-4 rounded-2xl relative leading-relaxed text-xs shadow-sm ${
                            isUser 
                              ? 'bg-[#1c1917] text-[#fcfbf9] rounded-br-none' 
                              : isErr 
                                ? 'bg-red-50 border border-red-200 text-red-950 rounded-bl-none'
                                : 'bg-[#ffffff] border border-[#e7e5e4] text-[#1c1917] rounded-bl-none'
                          }`}>
                            <div className="flex justify-between items-start gap-4">
                              <p className="font-semibold text-xs leading-relaxed">{msg.content}</p>
                              
                              <div className="flex gap-1.5 shrink-0 opacity-80 hover:opacity-100">
                                {/* TTS Playback button */}
                                <button
                                  onClick={() => speakText(msg.content)}
                                  className={`p-1 rounded-lg transition ${isUser ? 'hover:bg-[#292524] text-[#fcfbf9]' : 'hover:bg-[#f5f5f4] text-[#78716c] hover:text-[#1c1917]'}`}
                                  title="Listen to Swedish native speaker"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* expandable english translation */}
                            {msg.translation && (
                              <div className="mt-2.5 pt-2 border-t border-[#e7e5e4] text-[11px]">
                                <button
                                  onClick={() => toggleTranslation(msg.id)}
                                  className={`font-semibold uppercase tracking-wider mb-1 ${isUser ? 'text-[#fde68a] hover:text-[#fef3c7]' : 'text-[#78716c] hover:text-[#1c1917]'} flex items-center gap-1`}
                                >
                                  <span>{showTranslations[msg.id] ? 'Översättning' : 'Visa översättning (English)'}</span>
                                </button>
                                {showTranslations[msg.id] && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`italic ${isUser ? 'text-[#d6d3d1]' : 'text-[#57534e]'}`}
                                  >
                                    {msg.translation}
                                  </motion.p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display Grammatical Corrections explicitly under the User's bubble if errors exist */}
                      {isUser && msg.feedback && (
                        <div className="flex justify-end pl-5">
                          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4.5 max-w-[85%] text-xs text-[#292524] space-y-3.5 shadow-sm">
                            <div className="flex items-center gap-2 font-bold text-[#92400e]">
                              <AlertCircle className="w-4.5 h-4.5 text-[#d97706]" />
                              <span>AI-Språkcoach feedback:</span>
                            </div>
                            
                            {msg.feedback.hasErrors && msg.feedback.correctedSwedish ? (
                              <div className="space-y-2">
                                <div className="text-[10px] text-[#78716c] font-bold uppercase tracking-wider">Grammatisk korrigering:</div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <div className="bg-white px-2.5 py-1.5 rounded-xl border border-[#e7e5e4] text-red-700 font-semibold line-through decoration-red-400">
                                    {msg.content}
                                  </div>
                                  <span className="text-[#a8a29e] font-semibold">➔</span>
                                  <div className="bg-[#f0fdf4] text-[#166534] px-2.5 py-1.5 rounded-xl border border-[#dcfce7] font-bold">
                                    {msg.feedback.correctedSwedish}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[#15803d] font-bold inline-flex items-center gap-1">✨ Perfekt svenska! (Excellent grammar and structure)</div>
                            )}

                            {msg.feedback.explanation && (
                              <p className="text-[#57534e] leading-relaxed border-t border-[#e7e5e4] pt-2">{msg.feedback.explanation}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* AI loading simulation bubble */}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#ffffff] border border-[#e7e5e4] p-4 rounded-2xl rounded-bl-none shadow-sm text-[#78716c] flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#1c1917] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#1c1917] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#1c1917] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] font-bold text-[#78716c] tracking-wider uppercase">Coach tänker...</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Errors container */}
              {recognitionError && (
                <div className="bg-[#fee2e2] text-[#991b1b] px-4 py-2.5 text-xs font-semibold border-t border-b border-[#fca5a5] flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-[#ef4444]" /> {recognitionError}</span>
                  <button onClick={() => setRecognitionError(null)} className="font-bold hover:text-red-950">✕</button>
                </div>
              )}

              {/* Input Form area */}
              <form onSubmit={handleSendMessage} className="border-t border-[#e7e5e4] p-3.5 bg-white flex gap-2">
                {/* Speaking/Speech recognition button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-sm' 
                      : 'bg-[#1c1917] hover:bg-[#292524] text-[#fcfbf9]'
                  }`}
                  title={isRecording ? 'Listening... Click to lock translation' : 'Speak Swedish (Microphone Voice)'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Text entry field */}
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={isRecording ? 'Lyssnar nu... Prata på svenska!' : 'Skriv din mening här på svenska...'}
                  disabled={isAiLoading}
                  className="flex-1 px-4 py-3 border border-[#e7e5e4] rounded-xl focus:border-[#1c1917] outline-none text-xs placeholder-[#78716c]"
                  id="chat-sentence-input"
                />

                <button
                  type="submit"
                  disabled={!userInput.trim() || isAiLoading}
                  className="px-5 py-3 bg-[#1c1917] text-white font-bold rounded-xl hover:bg-[#292524] disabled:bg-[#f5f5f4] disabled:text-[#a8a29e] disabled:border disabled:border-[#e7e5e4] disabled:cursor-not-allowed transition shrink-0 cursor-pointer flex items-center justify-center text-xs shadow-sm"
                  id="submit-chat-button"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Right: Companion Sidebar with phrases and keywords (Takes 1 fraction) */}
            <div className="space-y-5">
              {/* PhraseBook Card */}
              <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-2xl p-5.5 space-y-4 scandi-shadow-sm">
                <h4 className="font-bold text-xs text-[#1c1917] border-b border-[#e7e5e4] pb-2.5 flex items-center gap-2 uppercase tracking-widest">
                  <Plus className="w-4 h-4 text-[#d97706]" /> suggested phrases
                </h4>
                <p className="text-[11px] text-[#57534e] leading-relaxed">
                  Stuck? Click any pre-translated Swedish phrase below to fill it into your chat field and practice reading aloud:
                </p>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedScenario.suggestedPhrases.map((phrase, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setUserInput(phrase);
                        speakText(phrase);
                      }}
                      className="w-full text-left p-2.5 border border-[#e7e5e4] hover:border-[#1c1917] rounded-xl bg-[#faf9f6] text-[11px] font-medium transition cursor-pointer text-[#1c1917] leading-normal"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlighting situational vocabulary tips */}
              <div className="bg-[#ffffff] border border-[#e7e5e4] rounded-2xl p-5.5 space-y-4 scandi-shadow-sm">
                <h4 className="font-bold text-xs text-[#1c1917] border-b border-[#e7e5e4] pb-2.5 flex items-center gap-2 uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 text-[#166534]" /> SCENARIO WORDS
                </h4>
                <p className="text-[11px] text-[#57534e] leading-relaxed">
                  Key Swedish vocabulary is compiled in real-time as your chat session flows:
                </p>

                <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-1">
                  {chatHistory.findLast((m) => m.role === 'user' && m.feedback?.vocabTips)?.feedback?.vocabTips?.map((tip, idx) => (
                    <div key={idx} className="p-3.5 bg-[#f0fdf4] rounded-xl border border-[#dcfce7] space-y-1.5 shadow-sm">
                      <div className="font-extrabold text-xs text-[#166534]">{tip.Swedish}</div>
                      <div className="text-[11px] text-[#15803d] font-semibold">{tip.English}</div>
                      <div className="text-[10px] text-[#57534e] leading-relaxed">{tip.definition}</div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-[11px] text-[#78716c] italic">
                      Conversing extracts new scenario words automatically. Start chatting to populate words!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
