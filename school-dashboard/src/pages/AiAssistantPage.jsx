import { useState, useRef, useEffect } from 'react';
import {
    Send, Sparkles, AlertCircle, Loader2, Copy, X,
    Paperclip, ChevronDown, MoveUp, Search, UserPlus, FileText,
    MessageSquare, Code, Settings, User, History, ArrowLeft, Mic, MicOff
} from 'lucide-react';
import { aiService } from '../services/aiService';
import AiOrb from '../components/AiOrb';
import Antigravity from '../components/Antigravity';
import { Avatar } from '@heroui/react';
import toast from 'react-hot-toast';
import { useAiAssistant } from '../components/AiAssistant/AiAssistantPanel';
import { useTranslation } from 'react-i18next';

export default function AiAssistantPage() {
  const { t } = useTranslation();
    // Get closePanel from context if available (when used in panel), otherwise undefined (when used as page)
    const aiContext = useAiAssistant();
    
    const closePanel = aiContext?.closePanel;
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);

    // For the initial empty state view
    const [hasInteracted, setHasInteracted] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const prebuiltPrompts = aiService.getPrebuiltPrompts();
    const selectedModelMeta = availableModels.find(model => model.id === selectedModel) || null;
    const hasAvailableModels = availableModels.some(model => model.available);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        let cancelled = false;

        const loadModels = async () => {
            try {
                const models = await aiService.getAvailableModels();
                if (cancelled) return;

                setAvailableModels(models);
                const nextDefaultModel =
                    aiService.getDefaultModelId() ||
                    models.find(model => model.available)?.id ||
                    models[0]?.id ||
                    '';

                setSelectedModel(currentModel => {
                    if (currentModel && models.some(model => model.id === currentModel && model.available)) {
                        return currentModel;
                    }

                    return nextDefaultModel;
                });
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load AI models:', error);
                    setAvailableModels([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingModels(false);
                }
            }
        };

        loadModels();

        return () => {
            cancelled = true;
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                // Transcribe the audio
                setIsTranscribing(true);
                try {
                    const transcription = await aiService.transcribeAudio(audioBlob);
                    setInput(prev => prev + (prev ? ' ' : '') + transcription);
                    toast.success(t('toast.success.voiceTranscribed'));
                    // Adjust height after setting input
                    if (inputRef.current) {
                        setTimeout(() => {
                            inputRef.current.style.height = 'auto';
                            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
                        }, 0);
                    }
                } catch (error) {
                    toast.error(t('toast.error.failedToTranscribeAudio'));
                    console.error('Transcription error:', error);
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.success(t('toast.success.recordingStarted'));
        } catch (error) {
            toast.error(t('toast.error.microphoneAccessDenied'));
            console.error('Recording error:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || isRecording || isTranscribing) return;
        if (!selectedModel || !hasAvailableModels) {
            toast.error(t('toast.error.theAiAssistantIsNotConfiguredRightNow'));
            return;
        }

        const userMessage = { role: 'user', content: input };

        // Optimistic UI update
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setHasInteracted(true);

        // Reset height
        if (inputRef.current) inputRef.current.style.height = 'auto';

        try {
            const conversationHistory = messages.filter(m => m.content);
            const result = await aiService.sendMessage([...conversationHistory, userMessage], null, selectedModel);
            // Extract just the content string from the result object
            const responseContent = typeof result === 'string' ? result : result.content;
            setMessages(prev => [...prev, { role: 'assistant', content: responseContent }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setHasInteracted(false);
        // Optional: clear messages if you want a fresh session every time they go back
        setMessages([]);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePromptClick = (promptText) => {
        setInput(promptText);
        inputRef.current?.focus();
    };

    return (
        <div className="flex h-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-100 font-sans transition-colors duration-300 overflow-hidden">

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center relative overflow-hidden">
                {!hasInteracted && (
                    <div className="absolute inset-0 z-0 opacity-15">
                        <Antigravity
                            count={300}
                            magnetRadius={6}
                            ringRadius={7}
                            waveSpeed={0.4}
                            waveAmplitude={1}
                            particleSize={1.5}
                            lerpSpeed={0.05}
                            color={'#9333ea'}
                            autoAnimate={true}
                            particleVariance={1}
                        />
                    </div>
                )}

                {/* Scrollable Chat Area */}
                <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center z-10">

                    {!hasInteracted ? (
                        /* Initial State (Centered Greeting) */
                        <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl px-4 animate-fade-in py-2 relative">
                            {/* Model Selector and Close Button (Initial) */}
                            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowModelSelector(!showModelSelector)}
                                        disabled={isLoadingModels || availableModels.length === 0}
                                        className="flex items-center gap-2 text-xs font-medium bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 shadow-sm text-gray-600 dark:text-gray-300 transition-colors"
                                    >
                                        <span>{selectedModelMeta?.name || (isLoadingModels ? 'Loading models...' : 'No model available')}</span>
                                        <ChevronDown size={14} className={`transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showModelSelector && (
                                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-[60] min-w-[200px] overflow-hidden py-1">
                                            {availableModels.map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model.id);
                                                        setShowModelSelector(false);
                                                        toast.success(`Switched to ${model.name}`);
                                                    }}
                                                    disabled={!model.available}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-0.5 ${selectedModel === model.id
                                                            ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400'
                                                            : 'text-gray-700 dark:text-gray-200'
                                                        } ${!model.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="font-medium flex items-center justify-between">
                                                        {model.name}
                                                        {selectedModel === model.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-500 line-clamp-1">{model.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Close button (only show in panel context) */}
                                {closePanel && (
                                    <button
                                        onClick={closePanel}
                                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                        aria-label={t('aria.buttons.closeAiAssistant')}
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Purple Orb */}
                            <div className="mb-2 relative scale-90">
                                <AiOrb size="xl" color="purple" />
                            </div>

                            {/* Greeting */}
                            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-1 text-center">{t('pages.goodAfternoonAdmin')}</h1>
                            <h2 className="text-2xl md:text-3xl font-semibold text-gray-400 mb-6 text-center">
                                What's on <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">your mind?</span>
                            </h2>

                            {/* Center Input Box (Initial Position) */}
                            <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-xl dark:shadow-zinc-900/50 p-3 md:p-4 relative group focus-within:border-purple-500/30 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all duration-300 z-20">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto'; // Reset height
                                        e.target.style.height = e.target.scrollHeight + 'px'; // Set new height
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Ask about students, staff, classes, or school work..."}
                                    disabled={isRecording || isTranscribing}
                                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-base md:text-lg placeholder-gray-400 dark:placeholder-gray-500 dark:text-zinc-100 resize-none max-h-32 py-2 px-2 custom-scrollbar min-h-[48px]"
                                    rows={1}
                                />

                                <div className="flex justify-between items-center mt-1 px-1">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-2 px-3">
                                            <Paperclip size={18} /> <span className="text-xs font-medium">{t('pages.attach')}</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Microphone Button */}
                                        <button
                                            onClick={toggleRecording}
                                            disabled={isLoading || isTranscribing}
                                            className={`p-2 rounded-full transition-all flex items-center justify-center ${isRecording
                                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                }`}
                                            title={isRecording ? "Stop recording" : "Start voice input"}
                                        >
                                            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                        </button>

                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || isRecording || isTranscribing || !selectedModel || !hasAvailableModels}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim()
                                                ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 scale-100'
                                                : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed scale-90'
                                                }`}
                                        >
                                            <MoveUp size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Suggested Actions Grid - Only show on empty state */}
                            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl mt-6 opacity-0 animate-[fade-in_0.5s_ease-out_0.5s_forwards] z-20">
                                {prebuiltPrompts.map((item, idx) => (
                                    <button
                                        key={item.label}
                                        onClick={() => handlePromptClick(item.prompt)}
                                        className="text-left p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 hover:border-purple-200/50 hover:shadow-md dark:hover:shadow-zinc-900/50 transition-all group h-20 flex flex-col justify-between"
                                    >
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-700 dark:text-zinc-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors line-clamp-1">{item.label}</div>
                                            <div className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 line-clamp-1">{item.prompt}</div>
                                        </div>
                                        <div className="self-end opacity-50 text-xl group-hover:opacity-100 group-hover:scale-110 transition-all">
                                            {item.icon}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Active Chat State */
                        <div className="w-full max-w-4xl flex-1 px-4 py-6 space-y-6 relative">
                            {/* Back Button Overlay */}
                            <div className="sticky top-0 z-50 flex justify-between items-center pb-4 bg-gradient-to-b from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent pointer-events-none">
                                <button
                                    onClick={handleBack}
                                    className="pointer-events-auto flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>

                                <div className="flex items-center gap-2">
                                    {/* Model Selector */}
                                    <div className="relative pointer-events-auto">
                                    <button
                                        onClick={() => setShowModelSelector(!showModelSelector)}
                                        disabled={isLoadingModels || availableModels.length === 0}
                                        className="flex items-center gap-2 text-xs font-medium bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                    >
                                        <span>{selectedModelMeta?.name || (isLoadingModels ? 'Loading models...' : 'No model available')}</span>
                                        <ChevronDown size={14} className={`transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showModelSelector && (
                                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-[60] min-w-[200px] overflow-hidden py-1">
                                            {availableModels.map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model.id);
                                                        setShowModelSelector(false);
                                                        toast.success(`Switched to ${model.name}`);
                                                    }}
                                                    disabled={!model.available}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-0.5 ${selectedModel === model.id
                                                        ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                        } ${!model.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="font-medium flex items-center justify-between">
                                                        {model.name}
                                                        {selectedModel === model.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-500 line-clamp-1">{model.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Close button (only show in panel context) */}
                                {closePanel && (
                                    <button
                                        onClick={closePanel}
                                        className="pointer-events-auto p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                        aria-label={t('aria.buttons.closeAiAssistant')}
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                </div>
                            </div>

                            {messages.map((msg, idx) => (
                                <div
                                    key={`msg-${idx}`}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 bg-white dark:bg-zinc-900">
                                            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                    )}

                                    <div className={`space-y-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {/* Name Label */}
                                        <div className="text-xs font-medium text-gray-400 px-1">
                                            {msg.role === 'user' ? 'You' : 'School AI Assistant'}
                                        </div>

                                        <div className={`whitespace-pre-wrap text-[15px] leading-relaxed rounded-2xl ${msg.role === 'user'
                                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 px-4 py-2 inline-block rounded-br-sm'
                                            : 'bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 px-4 py-3 rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 bg-white dark:bg-zinc-900 animate-pulse">
                                        <Sparkles size={16} className="text-gray-400" />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500 text-sm">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Bottom Input Area (Visible only when chat is active) */}
                {hasInteracted && (
                    <div className="w-full max-w-3xl px-4 pb-6 pt-2">
                        <div className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-[1.5rem] shadow-lg dark:shadow-zinc-900/50 p-3 relative group focus-within:border-purple-500/30 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all duration-300">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto'; // Reset height
                                    e.target.style.height = e.target.scrollHeight + 'px'; // Set new height
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Message the school AI assistant..."}
                                disabled={isRecording || isTranscribing}
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-base placeholder-gray-400 dark:placeholder-gray-500 dark:text-zinc-100 resize-none max-h-48 py-2 px-2 custom-scrollbar min-h-[44px]"
                                rows={1}
                            />
                            <div className="flex justify-between items-center mt-1 px-1">
                                <div className="flex items-center gap-2">
                                    <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                                        <Paperclip size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Microphone Button */}
                                    <button
                                        onClick={toggleRecording}
                                        disabled={isLoading || isTranscribing}
                                        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isRecording
                                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                            }`}
                                        title={isRecording ? "Stop recording" : "Start voice input"}
                                    >
                                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>

                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || !selectedModel || !hasAvailableModels}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim()
                                            ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 scale-100'
                                            : 'bg-gray-100 dark:bg-zinc-700 text-gray-300 dark:text-gray-500 cursor-not-allowed scale-90'
                                            }`}
                                    >
                                        <MoveUp size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">{t('pages.schoolAiAssistantCanMakeMistakesVerifyImportantInformation')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
