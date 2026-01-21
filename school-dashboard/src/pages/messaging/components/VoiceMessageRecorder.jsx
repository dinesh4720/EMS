import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Trash2 } from 'lucide-react';
import { Button, Progress } from '@heroui/react';

export default function VoiceMessageRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Setup audio context for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      // Start waveform visualization
      visualize();

      // Store timer interval
      mediaRecorder.timerInterval = timerInterval;

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear timer
      if (mediaRecorderRef.current.timerInterval) {
        clearInterval(mediaRecorderRef.current.timerInterval);
      }

      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      // Convert to simple waveform data
      const waveform = [];
      for (let i = 0; i < bufferLength; i++) {
        waveform.push(dataArray[i]);
      }

      setWaveformData(waveform);
    };

    draw();
  };

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setWaveformData([]);
    setRecordingTime(0);
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend({
        blob: audioBlob,
        duration: recordingTime,
        waveform: waveformData
      });

      // Reset
      handleDelete();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
          <span className="text-sm font-medium text-danger">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Waveform Visualization */}
      {isRecording && waveformData.length > 0 && (
        <div className="flex items-center gap-0.5 h-8">
          {waveformData.map((value, index) => (
            <div
              key={index}
              className="w-1 bg-primary rounded-full transition-all"
              style={{ height: `${(value / 255) * 100}%`, minHeight: '4px' }}
            />
          ))}
        </div>
      )}

      {/* Recorded Audio Preview */}
      {audioUrl && !isRecording && (
        <div className="flex items-center gap-2">
          <audio src={audioUrl} controls className="h-8" />
          <span className="text-xs text-default-500">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRecording && !audioUrl && (
          <Button
            isIconOnly
            size="sm"
            color="primary"
            onPress={startRecording}
            className="w-10 h-10 rounded-full"
          >
            <Mic size={18} />
          </Button>
        )}

        {isRecording && (
          <Button
            isIconOnly
            size="sm"
            color="danger"
            onPress={stopRecording}
            className="w-10 h-10 rounded-full"
          >
            <MicOff size={18} />
          </Button>
        )}

        {audioUrl && !isRecording && (
          <>
            <Button
              isIconOnly
              size="sm"
              color="danger"
              variant="light"
              onPress={handleDelete}
              className="w-10 h-10 rounded-full"
            >
              <Trash2 size={18} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              color="primary"
              onPress={handleSend}
              className="w-10 h-10 rounded-full"
            >
              <Send size={18} />
            </Button>
          </>
        )}

        {(isRecording || audioUrl) && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onCancel}
            className="w-10 h-10 rounded-full"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}
