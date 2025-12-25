// Audio Recording Utility
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

let recording = null;

export const startRecording = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to record audio');
      return null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    recording = newRecording;
    return recording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    Alert.alert('Error', 'Failed to start recording');
    return null;
  }
};

export const stopRecording = async () => {
  try {
    if (!recording) {
      return null;
    }

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    
    recording = null;

    return {
      uri,
      duration: status.durationMillis,
    };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    Alert.alert('Error', 'Failed to stop recording');
    return null;
  }
};

export const playAudio = async (uri) => {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    return sound;
  } catch (error) {
    console.error('Failed to play audio:', error);
    Alert.alert('Error', 'Failed to play audio');
    return null;
  }
};

export const uploadAudio = async (audioUri, type = 'homework') => {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: `voice_note_${Date.now()}.m4a`,
    });
    formData.append('type', type);

    // Replace with your actual API endpoint
    const response = await fetch(`${API_URL}/upload/audio`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Audio upload error:', error);
    throw error;
  }
};

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
