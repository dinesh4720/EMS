import React, { useState, useRef, useEffect } from 'react';
import {
    Send, Sparkles, AlertCircle, Loader2, Copy,
    Paperclip, ChevronDown, MoveUp, Search, UserPlus, FileText,
    MessageSquare, Code, Settings, User, History, ArrowLeft, Mic, MicOff
} from 'lucide-react';
import { aiService } from '../services/aiService';
import AiOrb from '../components/AiOrb';
import Antigravity from '../components/Antigravity';
import { Avatar } from '@heroui/react';
import toast from 'react-hot-toast';

export default function AiAssistantPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // For the initial empty state view
    const [hasInteracted, setHasInteracted] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const prebuiltPrompts = aiService.getPrebuiltPrompts();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    toast.success('Voice transcribed!');
                    // Adjust height after setting input
                    if (inputRef.current) {
                        setTimeout(() => {
                            inputRef.current.style.height = 'auto';
                            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
                        }, 0);
                    }
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

    const handleSend = async () => {
        if (!input.trim() || isLoading || isRecording || isTranscribing) return;

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
            const result = await aiService.sendMessage([...conversationHistory, userMessage]);
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
        <div className="flex h-screen bg-white dark:bg-zinc-950 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300 rounded-[2rem] overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-xl">

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
                        <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl px-4 animate-fade-in pb-12 pt-20">
                            {/* Purple Orb */}
                            <div className="mb-8 relative">
                                <AiOrb size="xl" color="purple" />
                            </div>

                            {/* Greeting */}
                            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Good Afternoon, Admin</h1>
                            <h2 className="text-3xl font-semibold text-gray-400 mb-10">
                                What's on <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">your mind?</span>
                            </h2>

                            {/* Center Input Box (Initial Position) */}
                            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-xl p-4 relative group focus-within:border-purple-500/30 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all duration-300 z-20">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto'; // Reset height
                                        e.target.style.height = e.target.scrollHeight + 'px'; // Set new height
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Ask AI a question or make a request..."}
                                    disabled={isRecording || isTranscribing}
                                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 dark:text-gray-100 resize-none max-h-48 py-2 px-2 custom-scrollbar"
                                    rows={1}
                                    style={{ minHeight: '56px' }}
                                />

                                <div className="flex justify-between items-center mt-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-2 px-3">
                                            <Paperclip size={18} /> <span className="text-xs font-medium">Attach</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
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
                                            disabled={!input.trim() || isRecording || isTranscribing}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim()
                                                ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 scale-100'
                                                : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed scale-90'
                                                }`}
                                        >
                                            <MoveUp size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Suggested Actions Grid - Only show on empty state */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mt-12 opacity-0 animate-[fade-in_0.5s_ease-out_0.5s_forwards] z-20">
                                {prebuiltPrompts.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handlePromptClick(item.prompt)}
                                        className="text-left p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800 hover:border-purple-200/50 hover:shadow-md transition-all group h-28 flex flex-col justify-between backdrop-blur-sm"
                                    >
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors line-clamp-1">{item.label}</div>
                                            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1 line-clamp-2">{item.prompt}</div>
                                        </div>
                                        <div className="self-end opacity-50 text-2xl group-hover:opacity-100 group-hover:scale-110 transition-all">
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
                            <div className="sticky top-0 z-50 flex justify-start pb-4 bg-gradient-to-b from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm"
                                >
                                    <ArrowLeft size={16} /> Back to Search
                                </button>
                            </div>

                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
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
                                            {msg.role === 'user' ? 'You' : 'ChatGPT 4o'}
                                        </div>

                                        <div className={`whitespace-pre-wrap text-[15px] leading-relaxed p-0 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 px-4 py-2 inline-block rounded-br-sm'
                                            : 'text-gray-800 dark:text-gray-200'
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
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
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
                        <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[1.5rem] shadow-lg p-3 relative group focus-within:border-purple-500/30 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all duration-300">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto'; // Reset height
                                    e.target.style.height = e.target.scrollHeight + 'px'; // Set new height
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Message ChatGPT..."}
                                disabled={isRecording || isTranscribing}
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-base placeholder-gray-400 dark:placeholder-gray-500 dark:text-gray-100 resize-none max-h-48 py-2 px-2 custom-scrollbar"
                                rows={1}
                                style={{ minHeight: '44px' }}
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
                                        disabled={!input.trim()}
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
                            <p className="text-xs text-gray-400 dark:text-gray-500">ChatGPT can make mistakes. Check important info.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
