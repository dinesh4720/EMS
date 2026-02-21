import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getInitials } from '../utils/helpers';

const Avatar = ({
  source,
  name,
  size = 'medium',
  style,
}) => {
  const { themeColors, typography } = useTheme();

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 80;
      case 'xlarge':
        return 120;
      default:
        return 50;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return typography.caption;
      case 'large':
        return typography.h3;
      case 'xlarge':
        return typography.h1;
      default:
        return typography.body;
    }
  };

  const sizeValue = getSizeValue();
  const fontSize = getFontSize();

  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: themeColors.backgroundSecondary,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize,
              color: themeColors.text,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});

export default Avatar;
