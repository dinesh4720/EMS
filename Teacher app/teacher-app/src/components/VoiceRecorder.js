import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';
import { startRecording, stopRecording, playAudio, formatDuration } from '../utils/audioRecorder';

export default function VoiceRecorder({ onRecordingComplete, existingRecording, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [recording, setRecording] = useState(existingRecording);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleStartRecording = async () => {
    const rec = await startRecording();
    if (rec) {
      setIsRecording(true);
      setRecordingDuration(0);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const result = await stopRecording();
    if (result) {
      setRecording(result);
      onRecordingComplete(result);
    }
  };

  const handlePlayPause = async () => {
    if (!recording) return;

    if (isPlaying) {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } else {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const newSound = await playAudio(recording.uri);
        if (newSound) {
          setSound(newSound);
          setIsPlaying(true);
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        }
      }
    }
  };

  const handleDelete = () => {
    if (sound) {
      sound.unloadAsync();
    }
    setRecording(null);
    setSound(null);
    setIsPlaying(false);
    onRecordingComplete(null);
  };

  if (recording) {
    return (
      <View style={styles.recordingPreview}>
        <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
          <Feather name={isPlaying ? "pause" : "play"} size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingLabel}>Voice Note</Text>
          <Text style={styles.recordingDuration}>
            {formatDuration(recording.duration)}
          </Text>
        </View>
        {!disabled && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Feather name="trash-2" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isRecording) {
    return (
      <View style={styles.recordingActive}>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
        <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
        <TouchableOpacity style={styles.stopBtn} onPress={handleStopRecording}>
          <Feather name="square" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  }

  if (disabled) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.recordBtn} onPress={handleStartRecording}>
      <Feather name="mic" size={18} color={COLORS.gray} />
      <Text style={styles.recordText}>Record Voice Note</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
    marginBottom: SPACING.m,
  },
  recordText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
    fontFamily: 'Inter_500Medium',
  },
  recordingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.danger,
  },
  recordingTime: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
    marginRight: SPACING.m,
  },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'Inter_500Medium',
  },
  recordingDuration: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
});
