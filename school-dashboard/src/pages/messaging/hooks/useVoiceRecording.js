import { useState, useRef } from 'react';

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [voicePreview, setVoicePreview] = useState(null);
  const [liveWaveform, setLiveWaveform] = useState([]);
  const recordingTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingDurationRef = useRef(0);

  return {
    isRecording, setIsRecording,
    recordingDuration, setRecordingDuration,
    mediaRecorder, setMediaRecorder,
    recordedChunks, setRecordedChunks,
    voicePreview, setVoicePreview,
    liveWaveform, setLiveWaveform,
    recordingTimerRef,
    mediaStreamRef,
    analyserRef,
    audioContextRef,
    animationFrameRef,
    recordingDurationRef,
  };
}
