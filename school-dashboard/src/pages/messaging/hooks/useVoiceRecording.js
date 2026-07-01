import { useState, useRef, useEffect } from 'react';

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
  // Holds the live MediaRecorder so unmount cleanup can reach it (and the
  // 100ms sample interval parked on it) without depending on React state.
  const mediaRecorderRef = useRef(null);

  // Tear everything down if the component unmounts mid-recording (e.g. the user
  // navigates away while the mic is hot). Without this, the mic stream stays
  // live, both the 1s duration interval and the 100ms RMS sampling interval keep
  // ticking forever, and the AudioContext is never closed — and browsers cap the
  // number of concurrent AudioContexts (~6), so repeated record/navigate cycles
  // eventually break recording entirely. (MEM-04)
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder) {
        // Drop the onstop handler first: stopping below would otherwise fire it
        // asynchronously, calling setState on an unmounted component and
        // double-closing the AudioContext we close here.
        recorder.onstop = null;
        if (recorder.sampleInterval) {
          clearInterval(recorder.sampleInterval);
          recorder.sampleInterval = null;
        }
        if (recorder.state !== 'inactive') {
          try {
            recorder.stop();
          } catch {
            // Recorder already stopped — nothing to do.
          }
        }
        mediaRecorderRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      analyserRef.current = null;

      const audioContext = audioContextRef.current;
      if (audioContext && audioContext.state !== 'closed') {
        // close() is async and rejects if already closing — swallow it.
        Promise.resolve(audioContext.close()).catch(() => {});
      }
      audioContextRef.current = null;
    };
  }, []);

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
    mediaRecorderRef,
  };
}
