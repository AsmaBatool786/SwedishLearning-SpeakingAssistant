import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PracticeScenario, ChatMessage, UserStats } from '../types';
import { practiceScenarios } from '../data/exercises';
import { 
  Coffee, MapPin, ShoppingBag, MessageSquare, Briefcase, Mic, MicOff, Send, Volume2, 
  Sparkles, CheckCircle2, ChevronRight, XCircle, AlertCircle, ArrowLeft, RotateCcw, Plus 
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
    if (scenId === 'smalltalk') return 'Hello colleague! Great to see you' + ' at the coffee machine. How has your week been so far?';
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
      case 'smalltalk': return <MessageSquare className={className} />;
      case 'job-interview': return <Briefcase className={className} />;
      default: return <MessageSquare className={className} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" id="speaking-panel-root">
      <AnimatePresence mode="wait">
        {!selectedScenario ? (
          // Scenarios list Screen
          <motion.div
            key="scenarios-list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e2e8f0] pb-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1e293b] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  AI Röst- & Samtalsträning (Speaking Practice)
                </h2>
                <p className="text-xs text-[#64748b] mt-1">
                  Connect to your virtual Swedish mentor to practice speech recognition, fika transactions, routes, and interviews.
                </p>
              </div>
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 border border-[#e2e8f0] text-[#1e293b] rounded-xl hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
              >
                Tillbaka till översikt (Back)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {practiceScenarios.map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => handleStartScenario(scen)}
                  className="p-6 border border-[#e2e8f0] rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-blue-400 cursor-pointer transition flex gap-4 md:items-start group"
                  id={`scenario-card-${scen.id}`}
                >
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition self-start shrink-0">
                    {renderScenarioIcon(scen.id, "w-5 h-5 text-blue-600")}
                  </div>
                  
                  <div className="space-y-1.5 w-full">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${
                        scen.difficulty.startsWith('A') 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-amber-50/70 text-amber-800'
                      }`}>
                        Svenska {scen.difficulty}
                      </span>
                      <span className="text-[10px] text-[#64748b] font-medium group-hover:text-blue-600 transition flex items-center">
                        BÖRJA <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#1e293b] leading-tight group-hover:text-blue-600 transition">
                      {scen.title}
                    </h3>
                    <p className="text-xs text-[#64748b] leading-relaxed">
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
            <div className="lg:col-span-2 flex flex-col bg-white border border-[#e2e8f0] rounded-3xl overflow-hidden h-[580px] shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
              
              {/* Chat Header */}
              <div className="bg-slate-50 border-b border-[#e2e8f0] px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedScenario(null)}
                    className="p-1.5 hover:bg-slate-200/50 rounded-xl transition mr-1 cursor-pointer"
                    title="Change Scenario"
                  >
                    <ArrowLeft className="w-4.5 h-4.5 text-[#64748b]" />
                  </button>
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    {renderScenarioIcon(selectedScenario.id, "w-4 h-4 text-blue-600")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#1e293b] leading-none">{selectedScenario.title}</h3>
                    <p className="text-[10px] text-[#64748b] mt-1">Difficulty {selectedScenario.difficulty} • AI Coach</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartScenario(selectedScenario)}
                    className="p-2 border border-[#e2e8f0] hover:bg-white rounded-xl transition text-[#1e293b] cursor-pointer text-[11px] font-medium inline-flex items-center gap-1 bg-slate-50/50"
                    title="Nollställ samtal (Reset chat)"
                  >
                    <RotateCcw className="w-3 h-3" /> Återställ
                  </button>
                </div>
              </div>

              {/* Chat Content Messages area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-[#fcfdfe]" id="chat-messages-scrollarea">
                {chatHistory.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isErr = msg.id.startsWith('ai-err-');

                  return (
                    <div key={msg.id} className="space-y-2">
                      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {/* Audio and text wrapper */}
                        <div className={`flex gap-2 max-w-[85%] items-end ${isUser ? 'flex-row-reverse' : ''}`}>
                          
                          {/* Chat bubble itself */}
                          <div className={`p-4 rounded-2xl relative leading-relaxed text-xs ${
                            isUser 
                              ? 'bg-[#1e293b] text-white rounded-br-none' 
                              : isErr 
                                ? 'bg-red-50 border border-red-150 text-red-950 rounded-bl-none'
                                : 'bg-white border border-[#e2e8f0] text-[#1e293b] rounded-bl-none shadow-[0_1px_2px_rgba(0,0,0,0.01)]'
                          }`}>
                            <div className="flex justify-between items-start gap-4">
                              <p className="font-medium">{msg.content}</p>
                              
                              <div className="flex gap-1.5 shrink-0 opacity-80 hover:opacity-100">
                                {/* TTS Playback button */}
                                <button
                                  onClick={() => speakText(msg.content)}
                                  className={`p-1 rounded-lg transition ${isUser ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-50 text-[#64748b]'}`}
                                  title="Listen to Swedish native speaker"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* expandable english translation */}
                            {msg.translation && (
                              <div className="mt-2.5 pt-2 border-t border-[#e2e8f0] text-[11px]">
                                <button
                                  onClick={() => toggleTranslation(msg.id)}
                                  className={`font-semibold uppercase tracking-wider mb-1 ${isUser ? 'text-blue-105 hover:text-white' : 'text-[#64748b] hover:text-[#1e293b]'} flex items-center gap-1`}
                                >
                                  <span>{showTranslations[msg.id] ? 'Översättning' : 'Visa översättning (English)'}</span>
                                </button>
                                {showTranslations[msg.id] && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`italic ${isUser ? 'text-slate-205' : 'text-[#64748b]'}`}
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
                          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 max-w-[85%] text-xs text-[#1e293b] space-y-2">
                            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <span>AI-Språkcoach feedback:</span>
                            </div>
                            
                            {msg.feedback.hasErrors && msg.feedback.correctedSwedish ? (
                              <div className="space-y-1.5">
                                <div className="text-[10px] text-[#64748b] font-medium uppercase">Grammatisk korrigering:</div>
                                <div className="bg-white p-2 rounded-xl border border-amber-100 text-amber-900 font-medium line-through decoration-red-400/50 mr-1 inline-block">
                                  {msg.content}
                                </div>
                                <div className="bg-emerald-50 text-emerald-950 p-2 rounded-xl border border-emerald-100 font-semibold inline-block">
                                  {msg.feedback.correctedSwedish}
                                </div>
                              </div>
                            ) : (
                              <div className="text-emerald-700 font-semibold">✨ Perfekt svenska! (Excellent grammar and structure)</div>
                            )}

                            {msg.feedback.explanation && (
                              <p className="text-[#64748b] leading-relaxed border-t border-[#e2e8f0] pt-1.5">{msg.feedback.explanation}</p>
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
                    <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl rounded-bl-none shadow-[0_1px_2px_rgba(0,0,0,0.01)] text-[#64748b] flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#64748b] tracking-wider">Coach tänker... (Coaching thinking)</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Errors container */}
              {recognitionError && (
                <div className="bg-amber-50 text-amber-905 px-4 py-2 text-xs font-medium border-t border-b border-amber-100 flex justify-between items-center">
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-600" /> {recognitionError}</span>
                  <button onClick={() => setRecognitionError(null)} className="font-semibold hover:text-amber-700">✕</button>
                </div>
              )}

              {/* Input Form area */}
              <form onSubmit={handleSendMessage} className="border-t border-[#e2e8f0] p-3 bg-white flex gap-2">
                {/* Speaking/Speech recognition button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : 'bg-[#1e293b] hover:bg-slate-800 text-white'
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
                  className="flex-1 px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:border-blue-400 outline-none text-xs placeholder-[#64748b]"
                  id="chat-sentence-input"
                />

                <button
                  type="submit"
                  disabled={!userInput.trim() || isAiLoading}
                  className="px-4 py-2.5 bg-[#1e293b] text-white font-medium rounded-xl hover:bg-slate-800 disabled:bg-slate-50 disabled:text-[#64748b] disabled:border disabled:border-[#e2e8f0] disabled:cursor-not-allowed transition shrink-0 cursor-pointer flex items-center justify-center text-xs"
                  id="submit-chat-button"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Right: Companion Sidebar with phrases and keywords (Takes 1 fraction) */}
            <div className="space-y-4">
              {/* PhraseBook Card */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <h4 className="font-semibold text-xs text-[#1e293b] border-b border-[#e2e8f0] pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Plus className="w-3.5 h-3.5 text-blue-500" /> Nyttiga uttryck (Suggested Phrases)
                </h4>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Stuck? Click any pre-translated Swedish cheat-sheet phrase below to fill it into your chat field and practice reading aloud:
                </p>

                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {selectedScenario.suggestedPhrases.map((phrase, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setUserInput(phrase);
                        speakText(phrase);
                      }}
                      className="w-full text-left p-2 border border-[#e2e8f0] hover:border-blue-300 rounded-xl bg-slate-50/50 hover:bg-blue-50/10 text-[11px] transition cursor-pointer text-[#1e293b] hover:text-blue-800"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlighting situational vocabulary tips */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <h4 className="font-semibold text-xs text-[#1e293b] border-b border-[#e2e8f0] pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Scenario Ordbok (Words)
                </h4>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Key Swedish vocabulary is compiled in real-time as your chat session flows:
                </p>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {chatHistory.findLast((m) => m.role === 'user' && m.feedback?.vocabTips)?.feedback?.vocabTips?.map((tip, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-1">
                      <div className="font-semibold text-xs text-emerald-900">{tip.Swedish}</div>
                      <div className="text-[11px] text-emerald-750 font-medium">{tip.English}</div>
                      <div className="text-[10px] text-[#64748b] leading-relaxed">{tip.definition}</div>
                    </div>
                  )) || (
                    <div className="text-center py-6 text-[10px] text-[#64748b] italic">
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
