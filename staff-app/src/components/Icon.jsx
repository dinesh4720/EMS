import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Home,
  Calendar,
  Clock,
  Bell,
  Book,
  BookOpen,
  GraduationCap,
  Pencil,
  FileText,
  Users,
  User,
  Check,
  CheckCircle,
  X,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  XCircle,
  MapPin,
  Building,
  Sun,
  Moon,
  Sunrise,
  Settings,
  Search,
  Filter,
  Menu,
  MoreHorizontal,
  BarChart,
  Star,
  Heart,
  TriangleAlert, // New name for AlertTriangle
} from 'lucide-react-native';

const Icon = ({ name, size = 24, color = '#1C1C1E', style }) => {
  const iconMap = {
    // Navigation
    'home': Home,
    'calendar': Calendar,
    'clock': Clock,
    'bell': Bell,

    // Classes
    'book': Book,
    'book-open': BookOpen,
    'graduation-cap': GraduationCap,
    'pencil': Pencil,
    'note': FileText,

    // People
    'users': Users,
    'user': User,
    'student': GraduationCap, // Fallback for student

    // Actions
    'check': Check,
    'check-circle': CheckCircle,
    'x': X,
    'plus': Plus,
    'minus': Minus,

    // Status
    'warning': TriangleAlert, // Use TriangleAlert
    'info': Info,
    'success': CheckCircle,
    'error': XCircle,

    // Location
    'location': MapPin,
    'building': Building,

    // Time
    'sun': Sun,
    'moon': Moon,
    'sunrise': Sunrise,

    // Misc
    'settings': Settings,
    'search': Search,
    'filter': Filter,
    'menu': Menu,
    'more': MoreHorizontal,
    'chart': BarChart,
    'star': Star,
    'heart': Heart,
  };

  const IconComponent = iconMap[name] || Info; // Fallback to Info

  return (
    <View style={[styles.container, style]}>
      <IconComponent size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
