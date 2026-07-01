import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, ArrowLeft, User } from 'lucide-react';
import { aiService } from '../services/aiService';
import Antigravity from '../components/Antigravity';
import ModelSelector from '../components/AiAssistant/ModelSelector';
import ChatComposer from '../components/AiAssistant/ChatComposer';
import toast from 'react-hot-toast';
import { useAiAssistant } from '../components/AiAssistant/AiAssistantPanel';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from '../utils/chartTheme';
import { cn } from '../utils/cn';
import logger from '../utils/logger';

export default function AiAssistantPage() {
  const { t } = useTranslation();
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
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const prebuiltPrompts = aiService.getPrebuiltPrompts();
  const selectedModelMeta = availableModels.find((model) => model.id === selectedModel) || null;
  const hasAvailableModels = availableModels.some((model) => model.available);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          models.find((model) => model.available)?.id ||
          models[0]?.id ||
          '';
        setSelectedModel((currentModel) => {
          if (currentModel && models.some((m) => m.id === currentModel && m.available)) {
            return currentModel;
          }
          return nextDefaultModel;
        });
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to load AI models:', error);
          setAvailableModels([]);
        }
      } finally {
        if (!cancelled) setIsLoadingModels(false);
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
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsTranscribing(true);
        try {
          const transcription = await aiService.transcribeAudio(audioBlob);
          setInput((prev) => prev + (prev ? ' ' : '') + transcription);
          toast.success(t('toast.success.voiceTranscribed'));
          if (inputRef.current) {
            setTimeout(() => {
              inputRef.current.style.height = 'auto';
              inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
            }, 0);
          }
        } catch (error) {
          toast.error(t('toast.error.failedToTranscribeAudio'));
          logger.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success(t('toast.success.recordingStarted'));
    } catch (error) {
      toast.error(t('toast.error.microphoneAccessDenied'));
      logger.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  // Stop the recorder and release the microphone if the user navigates away mid-recording.
  // Without this, the MediaRecorder and getUserMedia tracks survive unmount and the mic stays hot.
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        // Detach onstop so we don't fire a transcription request for a recording the user abandoned.
        recorder.onstop = null;
        recorder.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isRecording || isTranscribing) return;
    if (!selectedModel || !hasAvailableModels) {
      toast.error(t('toast.error.theAiAssistantIsNotConfiguredRightNow'));
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setHasInteracted(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const conversationHistory = messages.filter((m) => m.content);
      const result = await aiService.sendMessage(
        [...conversationHistory, userMessage],
        null,
        selectedModel,
      );
      const responseContent = typeof result === 'string' ? result : result.content;
      setMessages((prev) => [...prev, { role: 'assistant', content: responseContent }]);
    } catch (error) {
      logger.error('AI send error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('aiAssistant.sendError') || 'Sorry, I encountered an error connecting to the AI service.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setHasInteracted(false);
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

  const placeholder = isTranscribing
    ? t('pages.transcribing') || 'Transcribing...'
    : isRecording
      ? t('pages.listening') || 'Listening...'
      : hasInteracted
        ? t('pages.messageAssistant') || 'Message the school AI assistant...'
        : t('pages.askAboutSchool') || 'Ask about students, staff, classes, or school work...';

  const canSend = !!input.trim() && !isRecording && !isTranscribing && !!selectedModel && hasAvailableModels;

  return (
    <div className="flex h-full bg-surface text-fg font-sans transition-colors duration-300 overflow-hidden">
      <div className="flex-1 flex flex-col items-center relative overflow-hidden">
        {!hasInteracted && (
          <div className="absolute inset-0 z-0 opacity-15" aria-hidden="true">
            <Antigravity
              count={300}
              magnetRadius={6}
              ringRadius={7}
              waveSpeed={0.4}
              waveAmplitude={1}
              particleSize={1.5}
              lerpSpeed={0.05}
              color={CHART_COLORS.chart1}
              autoAnimate={true}
              particleVariance={1}
            />
          </div>
        )}

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center z-10">
          {!hasInteracted ? (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl px-4 animate-fade-in py-2 relative">
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <ModelSelector
                  models={availableModels}
                  selectedId={selectedModel}
                  selectedMeta={selectedModelMeta}
                  isLoading={isLoadingModels}
                  isOpen={showModelSelector}
                  onToggle={() => setShowModelSelector((v) => !v)}
                  onSelect={(id) => {
                    setSelectedModel(id);
                    setShowModelSelector(false);
                  }}
                />
                {closePanel && (
                  <button
                    type="button"
                    onClick={closePanel}
                    className="p-1.5 rounded-full hover:bg-surface-2 text-fg-faint hover:text-fg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                    aria-label={t('aria.buttons.closeAiAssistant')}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold text-fg mb-1 text-center">
                {t('pages.goodAfternoonAdmin')}
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-fg-faint mb-6 text-center">
                What's on{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">
                  your mind?
                </span>
              </h2>

              <div className="w-full max-w-2xl z-20">
                <ChatComposer
                  ref={inputRef}
                  value={input}
                  onChange={setInput}
                  onKeyDown={handleKeyDown}
                  onSend={handleSend}
                  onToggleRecording={toggleRecording}
                  isRecording={isRecording}
                  isTranscribing={isTranscribing}
                  isLoading={isLoading}
                  canSend={canSend}
                  placeholder={placeholder}
                  attachLabel={t('pages.attach')}
                  variant="initial"
                />
              </div>

              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl mt-6 opacity-0 animate-[fade-in_0.5s_ease-out_0.5s_forwards] z-20">
                {prebuiltPrompts.map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => handlePromptClick(item.prompt)}
                    className="text-left p-3 rounded-2xl border border-divider bg-surface-2 hover:bg-surface hover:border-violet-200/50 hover:shadow-md dark:hover:shadow-zinc-900/50 transition-all group h-20 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-fg group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                        {item.label}
                      </div>
                      <div className="text-fg-faint text-xs mt-0.5 line-clamp-1">
                        {item.prompt}
                      </div>
                    </div>
                    <div className="self-end opacity-50 text-xl group-hover:opacity-100 group-hover:scale-110 transition-all">
                      {item.icon}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex-1 px-4 py-6 space-y-6 relative">
              <div className="sticky top-0 z-50 flex justify-between items-center pb-4 bg-gradient-to-b from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent pointer-events-none">
                <button
                  type="button"
                  onClick={handleBack}
                  className="pointer-events-auto flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-token hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2"
                >
                  <ArrowLeft size={16} /> {t('common.back') || 'Back'}
                </button>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <ModelSelector
                    models={availableModels}
                    selectedId={selectedModel}
                    selectedMeta={selectedModelMeta}
                    isLoading={isLoadingModels}
                    isOpen={showModelSelector}
                    onToggle={() => setShowModelSelector((v) => !v)}
                    onSelect={(id) => {
                      setSelectedModel(id);
                      setShowModelSelector(false);
                    }}
                    variant="glass"
                  />
                  {closePanel && (
                    <button
                      type="button"
                      onClick={closePanel}
                      className="p-1.5 rounded-full hover:bg-surface-2 text-fg-faint hover:text-fg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                      aria-label={t('aria.buttons.closeAiAssistant')}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {messages.map((msg, idx) => (
                <div
                  key={`msg-${idx}-${msg.role}`}
                  className={cn('flex gap-4', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full border border-border-token flex items-center justify-center flex-shrink-0 bg-surface">
                      <Sparkles size={16} className="text-violet-600 dark:text-violet-400" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'space-y-1 max-w-[85%]',
                      msg.role === 'user' ? 'text-right' : 'text-left',
                    )}
                  >
                    <div className="text-xs font-medium text-fg-faint px-1">
                      {msg.role === 'user'
                        ? t('common.you') || 'You'
                        : t('pages.schoolAiAssistant') || 'School AI Assistant'}
                    </div>

                    <div
                      className={cn(
                        'whitespace-pre-wrap text-sm leading-relaxed rounded-2xl',
                        msg.role === 'user'
                          ? 'bg-surface-2 text-fg px-4 py-2 inline-block rounded-br-sm'
                          : 'bg-surface-2 text-fg px-4 py-3 rounded-bl-sm',
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-fg-muted" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4" role="status" aria-live="polite">
                  <div className="w-8 h-8 rounded-full border border-border-token flex items-center justify-center flex-shrink-0 animate-shimmer">
                    <Sparkles size={16} className="text-fg-faint" />
                  </div>
                  <div className="flex items-center gap-2 text-fg-faint text-sm">
                    {t('pages.thinking') || 'Thinking...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {hasInteracted && (
          <div className="w-full max-w-3xl px-4 pb-6 pt-2">
            <ChatComposer
              ref={inputRef}
              value={input}
              onChange={setInput}
              onKeyDown={handleKeyDown}
              onSend={handleSend}
              onToggleRecording={toggleRecording}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              isLoading={isLoading}
              canSend={canSend}
              placeholder={placeholder}
              variant="inline"
            />
            <div className="text-center mt-2">
              <p className="text-xs text-fg-faint">
                {t('pages.schoolAiAssistantCanMakeMistakesVerifyImportantInformation')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
