import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Card, Loading, EmptyState } from '../components';
import { formatDate } from '../utils/helpers';
import api from '../services/api';
import { Bell, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const AnnouncementsScreen = () => {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAnnouncements();
      if (response.success) {
        setAnnouncements(response.data?.announcements || response.data || []);
      } else {
        setError('Failed to load announcements');
      }
    } catch (err) {
      setError('Unable to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  if (loading && !announcements.length) {
    return <Loading fullScreen message="Loading announcements..." />;
  }

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
      case 'urgent':
        return themeColors.error || '#ef4444';
      case 'medium':
        return themeColors.warning || '#f59e0b';
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
          {error ? (
            <Card style={styles.errorCard}>
              <Text style={[styles.errorText, { color: themeColors.error || '#ef4444' }]}>
                {error}
              </Text>
            </Card>
          ) : null}

          {announcements.length > 0 ? (
            announcements.map((item, index) => (
              <Card key={item._id || item.id || index} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.priority && item.priority !== 'low' && (
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {item.content || item.message || item.body ? (
                  <Text style={[styles.content2, { color: themeColors.textSecondary }]}>
                    {item.content || item.message || item.body}
                  </Text>
                ) : null}

                <View style={styles.announcementFooter}>
                  {item.author || item.createdBy ? (
                    <Text style={[styles.author, { color: themeColors.textTertiary }]}>
                      By {item.author || item.createdBy}
                    </Text>
                  ) : null}
                  <View style={styles.dateRow}>
                    <Calendar size={12} color={themeColors.textTertiary} />
                    <Text style={[styles.date, { color: themeColors.textTertiary }]}>
                      {formatDate(item.publishedAt || item.createdAt)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : !error ? (
            <EmptyState
              title={t('screens.noAnnouncements1')}
              message="School announcements will appear here."
              icon={<Bell size={48} color={themeColors.textTertiary} />}
            />
          ) : null}
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
  errorCard: {
    marginBottom: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  announcementCard: {
    marginBottom: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content2: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
  },
});

export default AnnouncementsScreen;
