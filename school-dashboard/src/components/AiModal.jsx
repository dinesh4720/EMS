import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare, ChevronRight, Loader2, Copy, RefreshCw, CheckCircle, AlertCircle, Mic, MicOff, ChevronDown } from 'lucide-react';
import { aiService } from '../services/aiService';
import AiOrb from './AiOrb';
import toast from 'react-hot-toast';

export default function AiModal({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm your AI assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activePrompt, setActivePrompt] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [selectedModel, setSelectedModel] = useState('groq');
    const [showModelSelector, setShowModelSelector] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const prebuiltPrompts = aiService.getPrebuiltPrompts();
    const availableModels = aiService.getAvailableModels();

    useEffect(() => {
        scrollToBottom();
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setActivePrompt(null);

        try {
            const conversationHistory = messages.filter(m => m.content);
            const result = await aiService.sendMessage([...conversationHistory, userMessage], (functionName, args) => {
                // Show a loading message when function is being called
                setMessages(prev => [...prev, { 
                    role: 'system', 
                    content: `🔄 Executing: ${functionName}...`,
                    isFunction: true 
                }]);
            }, selectedModel);

            // Remove the function loading message
            setMessages(prev => prev.filter(m => !m.isFunction));

            // Show success/error toast if function was called
            if (result.functionCalled && result.functionResult) {
                if (result.functionResult.success) {
                    toast.success(result.functionResult.message || 'Action completed successfully!');
                } else {
                    toast.error(result.functionResult.error || 'Action failed');
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the AI service." }]);
            toast.error('Failed to process request');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePromptClick = (prompt) => {
        setInput(prompt.prompt);
        setActivePrompt(prompt.id);
        inputRef.current?.focus();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

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
                    setInput(transcription);
                    toast.success('Voice transcribed!');
                } catch (error) {
                    toast.error('Failed to transcribe audio');
                    console.error('Transcription error:', error);
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.success('Recording started');
        } catch (error) {
            toast.error('Microphone access denied');
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

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-md h-full bg-white/95 dark:bg-black/95 border-l border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 -ml-2 rounded-full overflow-hidden relative flex items-center justify-center flex-shrink-0">
                                    <AiOrb size="md" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                        AI Companion
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                            Online
                                        </span>
                                    </h2>
                                    {/* Model Selector */}
                                    <div className="relative mt-1">
                                        <button
                                            onClick={() => setShowModelSelector(!showModelSelector)}
                                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                        >
                                            <span>{availableModels.find(m => m.id === selectedModel)?.name || 'Select Model'}</span>
                                            <ChevronDown size={12} className={`transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showModelSelector && (
                                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 min-w-[200px]">
                                                {availableModels.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            setSelectedModel(model.id);
                                                            setShowModelSelector(false);
                                                            toast.success(`Switched to ${model.name}`);
                                                        }}
                                                        disabled={!model.available}
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                                            selectedModel === model.id ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                                                        } ${!model.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="font-medium">{model.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{model.provider} • {model.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative bg-gray-50/50 dark:bg-transparent">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>

                                        {msg.role === 'assistant' && (
                                            <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={() => copyToClipboard(msg.content)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    title="Copy"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl p-4 rounded-bl-none flex items-center gap-2 shadow-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                        <span className="text-sm text-gray-500">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions / Prompt Starters */}
                        {messages.length === 1 && (
                            <div className="px-4 pb-2 bg-gray-50/50 dark:bg-transparent">
                                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Suggested Actions</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {prebuiltPrompts.map((prompt) => (
                                        <button
                                            key={prompt.id}
                                            onClick={() => handlePromptClick(prompt)}
                                            className="text-left p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500/50 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{prompt.icon}</span>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">{prompt.label}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{prompt.prompt}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white/80 dark:bg-black/80 border-t border-gray-100 dark:border-white/10 backdrop-blur-md">
                            <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/10 p-2 transition-all shadow-sm">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Recording..." : "Ask me anything..."}
                                    disabled={isRecording || isTranscribing}
                                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none ring-0 text-gray-800 dark:text-white placeholder-gray-400 resize-none max-h-32 py-2.5 px-3 text-sm custom-scrollbar"
                                    rows={1}
                                    style={{ minHeight: '44px' }}
                                />
                                <button
                                    onClick={toggleRecording}
                                    disabled={isLoading || isTranscribing}
                                    className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                                        isRecording 
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse' 
                                            : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-700'
                                    } disabled:opacity-50`}
                                    title={isRecording ? "Stop recording" : "Start voice input"}
                                >
                                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading || isRecording || isTranscribing}
                                    className="p-2 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex-shrink-0"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">
                                    {isRecording ? '🎤 Recording...' : isTranscribing ? '⏳ Transcribing...' : `Powered by ${availableModels.find(m => m.id === selectedModel)?.name || 'AI'}`}
                                </p>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
