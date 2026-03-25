import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  DollarSign,
  Calendar,
  Download,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { payslipsApi } from '../services/api';
import { useTranslation } from 'react-i18next';

const PayslipCard = ({ payslip, onPress, theme }) => {
  const { t } = useTranslation();
  const { colors, typography, shape, spacing } = theme;

  const getStatusColor = () => {
    switch (payslip.paymentStatus) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'processed':
        return colors.primary;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.payslipCard,
        {
          backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainer,
          borderRadius: shape.cornerLarge,
          borderColor: colors.outlineVariant,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.payslipHeader}>
        <View style={[styles.monthBadge, { backgroundColor: colors.primaryContainer }]}>
          <Calendar size={16} color={colors.onPrimaryContainer} />
          <Text style={[typography.labelMedium, { color: colors.onPrimaryContainer, marginLeft: 6 }]}>
            {payslip.month} {payslip.year}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[typography.labelSmall, { color: statusColor, textTransform: 'capitalize' }]}>
            {payslip.paymentStatus || 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.payslipDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <TrendingUp size={16} color={colors.success} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
              Basic
            </Text>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              ${payslip.basicSalary?.toLocaleString() || 0}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <TrendingDown size={16} color={colors.error} />
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
              Deductions
            </Text>
            <Text style={[typography.titleMedium, { color: colors.error }]}>
              -${payslip.deductions?.toLocaleString() || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.payslipFooter, { borderTopColor: colors.outlineVariant }]}>
        <View style={styles.netPay}>
          <Wallet size={18} color={colors.primary} />
          <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
            Net Pay
          </Text>
          <Text style={[typography.titleLarge, { color: colors.primary, fontWeight: '700' }]}>
            ${payslip.netSalary?.toLocaleString() || 0}
          </Text>
        </View>
        {payslip.payslipFileUrl && (
          <Pressable
            style={[styles.downloadBtn, { backgroundColor: colors.secondaryContainer, borderRadius: shape.cornerSmall }]}
            onPress={() => Linking.openURL(payslip.payslipFileUrl)}
          >
            <Download size={18} color={colors.onSecondaryContainer} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

const PayslipsScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, typography, spacing, shape } = theme;
  const { user } = useAuth();

  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.code) {
      setError('Staff code not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [payslipsData, summaryData] = await Promise.all([
        payslipsApi.getStaffPayslips(user.code),
        payslipsApi.getSummary(user.code),
      ]);
      setPayslips(payslipsData?.payslips || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching payslips:', err);
      setError(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, [user?.code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePayslipPress = (payslip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to detail or download
    if (payslip.payslipFileUrl) {
      Linking.openURL(payslip.payslipFileUrl);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Summary Card */}
      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.primaryContainer, borderRadius: shape.cornerLarge }]}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color={colors.onPrimaryContainer} />
            <Text style={[typography.titleMedium, { color: colors.onPrimaryContainer, marginLeft: 8 }]}>
              {summary.year} Earnings
            </Text>
          </View>
          <Text style={[typography.displaySmall, { color: colors.onPrimaryContainer, marginTop: 8 }]}>
            ${summary.totalEarnings?.toLocaleString() || 0}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onPrimaryContainer, opacity: 0.7 }]}>
            {summary.totalPayslips} payslips
          </Text>
        </View>
      )}

      <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.sm }]}>
        Payslip History
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <DollarSign size={64} color={colors.outline} />
      <Text style={[typography.titleLarge, { color: colors.onSurface, marginTop: spacing.md }]}>
        No Payslips
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }]}>
        Your payslips will appear here once they are generated.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
        <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.payslips')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
            Loading payslips...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>{t('screens.payslips')}</Text>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
          <Text style={[typography.labelMedium, { color: colors.onErrorContainer }]}>{error}</Text>
        </View>
      )}

      <FlatList
        data={payslips}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PayslipCard
            payslip={item}
            onPress={() => handlePayslipPress(item)}
            theme={theme}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { padding: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    marginBottom: 8,
  },
  summaryCard: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payslipCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payslipDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  payslipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  netPay: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  downloadBtn: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorBanner: {
    padding: 12,
    alignItems: 'center',
  },
});

export default PayslipsScreen;
