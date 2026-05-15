import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import logger from '../../../utils/logger';


export function useVoiceMessageHandler({
  user,
  selectedConversation,
  voiceRecordingState,
  chatService,
  socketService,
  setMessages,
  setSending,
  setUploadingFile,
  setUploadProgress,
  scrollToBottom,
  loadConversations,
  pendingSocketMessagesRef,
}) {
  const { t } = useTranslation();

  const {
    voicePreview, setVoicePreview,
    setLiveWaveform,
    setIsRecording,
    setRecordingDuration,
    mediaRecorder, setMediaRecorder,
    setRecordedChunks,
    recordingTimerRef,
    mediaStreamRef,
    analyserRef,
    audioContextRef,
    animationFrameRef,
    recordingDurationRef,
  } = voiceRecordingState;

  // Compress waveform samples to a specific number of bars
  const compressWaveform = useCallback((samples, targetBars) => {
    if (!samples || samples.length === 0) {
      return Array(targetBars).fill(0.1);
    }

    const result = [];
    const samplesPerBar = Math.max(1, Math.floor(samples.length / targetBars));

    for (let i = 0; i < targetBars; i++) {
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, samples.length);

      if (start >= samples.length) {
        result.push(0.1);
        continue;
      }

      // Take the maximum amplitude in this segment (peak detection)
      let max = 0.1;
      for (let j = start; j < end; j++) {
        if (samples[j] > max) max = samples[j];
      }

      // Apply some gain and normalize
      const amplified = Math.min(1, max * 3);
      result.push(Math.max(0.1, amplified));
    }

    return result;
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      // Clear any previous preview
      if (voicePreview?.url) {
        URL.revokeObjectURL(voicePreview.url);
        setVoicePreview(null);
      }
      setLiveWaveform([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup audio analyser for waveform visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      const recorder = new MediaRecorder(stream);
      const chunks = [];
      const allAmplitudeSamples = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        const finalDuration = recordingDurationRef.current;

        // Compress all amplitude samples to 50 bars for display
        const compressedWaveform = compressWaveform(allAmplitudeSamples, 50);

        // Show preview instead of auto-sending
        setVoicePreview({
          blob,
          url,
          duration: finalDuration,
          waveform: compressedWaveform
        });
        setRecordedChunks([]);
        setIsRecording(false);

        // Stop animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        // Close audio context
        audioContext.close();
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;

      // Store samples array reference for the recorder
      recorder.amplitudeSamples = allAmplitudeSamples;

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newValue = prev + 1;
          recordingDurationRef.current = newValue;
          return newValue;
        });
      }, 1000);

      // Sample amplitude at regular intervals (100ms = 10 samples per second)
      const sampleInterval = setInterval(() => {
        if (!analyserRef.current || !recorder.amplitudeSamples) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (root mean square) amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Store the amplitude sample
        recorder.amplitudeSamples.push(rms);

        // Update live display - show last 50 samples for real-time visualization
        const recentSamples = recorder.amplitudeSamples.slice(-50);
        setLiveWaveform(recentSamples);
      }, 100);

      recorder.sampleInterval = sampleInterval;

    } catch (error) {
      logger.error('Error starting recording:', error);
      toast.error(t('messaging.toast.failedToAccessMicrophone', 'Failed to access microphone'));
    }
  }, [voicePreview, setVoicePreview, setLiveWaveform, mediaStreamRef, analyserRef, audioContextRef, setIsRecording, setRecordingDuration, recordingDurationRef, setMediaRecorder, setRecordedChunks, recordingTimerRef, animationFrameRef, compressWaveform, t]);

  const handleStopRecording = useCallback(() => {
    // Clear the sample interval
    if (mediaRecorder && mediaRecorder.sampleInterval) {
      clearInterval(mediaRecorder.sampleInterval);
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [mediaRecorder, recordingTimerRef, animationFrameRef]);

  const handleCancelVoicePreview = useCallback(() => {
    if (voicePreview?.url) {
      URL.revokeObjectURL(voicePreview.url);
    }
    setVoicePreview(null);
    setRecordingDuration(0);
    setLiveWaveform([]);
    recordingDurationRef.current = 0;
  }, [voicePreview, setVoicePreview, setRecordingDuration, setLiveWaveform, recordingDurationRef]);

  const handleSendVoiceMessage = useCallback(async () => {
    if (!voicePreview || !selectedConversation) return;

    const { blob, duration, waveform } = voicePreview;
    const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

    setSending(true);
    try {
      setUploadingFile(true);
      setUploadProgress(0);

      // Upload file
      const uploadResult = await chatService.uploadFile(file, setUploadProgress);

      if (!uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Get receiver info
      const otherParticipant = selectedConversation.otherParticipant ||
        selectedConversation.participants?.find(p => p.userId !== user?.id);

      if (!otherParticipant) {
        throw new Error('Cannot find conversation participant');
      }

      // Send message with audio
      const clientMessageId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        conversationId: selectedConversation.id,
        receiverId: otherParticipant.userId,
        receiverModel: otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: '',
        type: 'audio',
        fileUrl: uploadResult.url,
        duration: duration,
        waveform: waveform,
        clientMessageId
      };

      let sendFailed = false;

      if (socketService.isConnected()) {
        const tempId = `temp_${Date.now()}`;
        try {
          socketService.sendMessage(messageData);

          // Optimistically add message with proper flags for deduplication
          const optimisticMessage = {
            id: tempId,
            ...messageData,
            senderId: user.id,
            senderName: user.name,
            status: 'sending',
            createdAt: new Date(),
            _isOptimistic: true,
            _originalContent: ''
          };
          setMessages(prev => [...prev, optimisticMessage]);
          setTimeout(() => scrollToBottom(), 100);

          // Track for delivery confirmation
          pendingSocketMessagesRef?.current?.add(tempId);

          // Delivery timeout — retry via REST if not confirmed in 8s
          setTimeout(async () => {
            if (!pendingSocketMessagesRef?.current?.has(tempId)) return;
            pendingSocketMessagesRef.current.delete(tempId);
            try {
              const sentMessage = await chatService.sendMessage({
                ...messageData,
                senderId: user.id,
                senderModel: 'Staff'
              });
              setMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
            } catch {
              setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, status: 'failed' } : m
              ));
              toast.error(t('messaging.chat.deliveryFailed', 'Voice message delivery failed'));
            }
          }, 8000);
        } catch {
          // Socket send threw — immediate REST fallback
          try {
            const sentMessage = await chatService.sendMessage({
              ...messageData,
              senderId: user.id,
              senderModel: 'Staff'
            });
            setMessages(prev => [...prev, sentMessage]);
            setTimeout(() => scrollToBottom(), 100);
          } catch {
            // Double failure: both socket and REST failed
            sendFailed = true;
            setMessages(prev => [...prev, {
              id: `failed-${Date.now()}`,
              ...messageData,
              senderId: user.id,
              senderName: user.name,
              status: 'failed',
              createdAt: new Date(),
            }]);
            toast.error(t('messaging.chat.deliveryFailed', 'Voice message delivery failed'));
          }
        }
      } else {
        const sentMessage = await chatService.sendMessage({
          ...messageData,
          senderId: user.id,
          senderModel: 'Staff'
        });
        setMessages(prev => [...prev, sentMessage]);
        setTimeout(() => scrollToBottom(), 100);
      }

      // Clear preview
      URL.revokeObjectURL(voicePreview.url);
      setVoicePreview(null);
      setRecordingDuration(0);
      setLiveWaveform([]);

      // Reload conversations
      loadConversations();
      if (!sendFailed) {
        toast.success(t('messaging.toast.voiceMessageSent', 'Voice message sent'));
      }
    } catch (error) {
      logger.error('Error sending voice message:', error);
      toast.error(t('messaging.toast.failedToSendVoiceMessage', 'Failed to send voice message'));
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      setSending(false);
    }
  }, [voicePreview, selectedConversation, user, chatService, socketService, setMessages, setSending, setUploadingFile, setUploadProgress, setVoicePreview, setRecordingDuration, setLiveWaveform, scrollToBottom, loadConversations, t]);

  return {
    handleStartRecording,
    handleStopRecording,
    handleCancelVoicePreview,
    handleSendVoiceMessage,
  };
}
