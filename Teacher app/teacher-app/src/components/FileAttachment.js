import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';
import { formatFileSize } from '../utils/fileUpload';

export default function FileAttachment({ files, onAdd, onRemove, disabled = false }) {
  return (
    <View style={styles.container}>
      {files.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filesList}>
          {files.map((file, index) => (
            <View key={index} style={styles.fileChip}>
              <Feather name="file" size={14} color={COLORS.primary} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name || 'File'}
                </Text>
                {file.size && (
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                )}
              </View>
              {!disabled && (
                <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeBtn}>
                  <Feather name="x" size={14} color={COLORS.gray} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {!disabled && (
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Feather name="paperclip" size={18} color={COLORS.gray} />
          <Text style={styles.addText}>
            {files.length > 0 ? 'Add More Files' : 'Attach Files'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  filesList: {
    marginBottom: SPACING.s,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: SPACING.s,
  },
  fileInfo: {
    marginLeft: 6,
    marginRight: 6,
    maxWidth: 150,
  },
  fileName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.dark,
  },
  fileSize: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  removeBtn: {
    padding: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
  },
  addText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
    fontFamily: 'Inter_500Medium',
  },
});
