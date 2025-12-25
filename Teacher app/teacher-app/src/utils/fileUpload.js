// File Upload Utility
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets || result;
  } catch (error) {
    console.error('Error picking document:', error);
    Alert.alert('Error', 'Failed to pick document');
    return null;
  }
};

export const pickImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access photos');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
};

export const uploadFile = async (file, type = 'homework') => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name || 'file',
    });
    formData.append('type', type);

    // Replace with your actual API endpoint
    const response = await fetch(`${API_URL}/upload`, {
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
    console.error('Upload error:', error);
    throw error;
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
