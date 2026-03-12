import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading, EmptyState } from '../components';
import { formatDate } from '../utils/helpers';
import { MessageSquare, Calendar } from 'lucide-react-native';

const RemarksScreen = () => {
  const { remarks, loading, fetchRemarks } = useStudent();
  const { themeColors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchRemarks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRemarks();
    setRefreshing(false);
  };

  if (loading.remarks && !remarks.length) {
    return <Loading fullScreen message="Loading remarks..." />;
  }

  const getCategoryColor = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'achievement':
        return themeColors.success || '#22c55e';
      case 'academic':
      case 'attendance':
        return themeColors.primary || '#3b82f6';
      case 'behavioral':
        return themeColors.warning || '#f59e0b';
      case 'health':
        return themeColors.error || '#ef4444';
      case 'general':
      default:
        return themeColors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {remarks.length > 0 ? (
            remarks.map((remark, index) => (
              <Card key={remark._id || remark.id || index} style={styles.remarkCard}>
                <View style={styles.remarkHeader}>
                  <View style={styles.remarkMeta}>
                    <Text style={[styles.teacherName, { color: themeColors.text }]}>
                      {remark.authorName || 'Teacher'}
                    </Text>
                    {remark.title && (
                      <Text style={[styles.subject, { color: themeColors.textSecondary }]}>
                        {remark.title}
                      </Text>
                    )}
                  </View>
                  {remark.category && (
                    <View style={[styles.typeBadge, { backgroundColor: getCategoryColor(remark.category) + '20' }]}>
                      <Text style={[styles.typeText, { color: getCategoryColor(remark.category) }]}>
                        {remark.category.charAt(0).toUpperCase() + remark.category.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.remarkText, { color: themeColors.text }]}>
                  {remark.description || ''}
                </Text>

                <View style={styles.remarkFooter}>
                  <Calendar size={12} color={themeColors.textTertiary} />
                  <Text style={[styles.date, { color: themeColors.textTertiary }]}>
                    {formatDate(remark.date || remark.createdAt)}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No Remarks"
              message="Teacher remarks and feedback will appear here."
              icon={<MessageSquare size={48} color={themeColors.textTertiary} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  remarkCard: {
    marginBottom: 12,
  },
  remarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  remarkMeta: {
    flex: 1,
    marginRight: 8,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subject: {
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  remarkText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  remarkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
  },
});

export default RemarksScreen;
