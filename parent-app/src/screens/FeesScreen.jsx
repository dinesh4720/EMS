import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, Loading, EmptyState } from '../components';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useNavigation } from '@react-navigation/native';
import {
import { useTranslation } from 'react-i18next';
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const FeesScreen = () => {
  const { t } = useTranslation();
  const { fees, loading, fetchFees } = useStudent();
  const { themeColors } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showFeeStructure, setShowFeeStructure] = React.useState(false);
  const [showAllPayments, setShowAllPayments] = React.useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFees();
    setRefreshing(false);
  };

  // Parse fee data from backend response
  const feeData = useMemo(() => {
    if (!fees) return null;

    const details = fees.feeDetails || {};
    const totalFee = details.totalFee || 0;
    const paid = details.paidAmount || 0;
    const balance = details.balanceAmount || (totalFee - paid);
    const discount = details.discountApplied || 0;
    const status = fees.feeStatus || 'pending';
    const payments = fees.recentPayments || [];

    // Fee structure from separate endpoint
    const structure = fees.feeStructure;
    const feeHeads = structure?.feeHeads || [];

    return {
      totalFee,
      paid,
      balance,
      discount,
      status,
      payments,
      feeHeads,
      lastPaymentDate: details.lastPaymentDate,
      paidPercentage: totalFee > 0 ? Math.round((paid / totalFee) * 100) : 0,
    };
  }, [fees]);

  const handleDownloadInvoice = (payment) => {
    // Generate invoice details for download/share
    Alert.alert(
      'Invoice Details',
      `Receipt No: ${payment.receiptNumber}\nAmount: ${formatCurrency(payment.amount)}\nDate: ${formatDate(payment.paymentDate)}\nMode: ${payment.paymentMode || 'N/A'}\nTransaction ID: ${payment.transactionId || 'N/A'}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
            try {
              Share.share({
                message: `Fee Receipt\n\nReceipt No: ${payment.receiptNumber}\nStudent: ${fees?.studentName || ''}\nAmount: ${formatCurrency(payment.amount)}\nDate: ${formatDate(payment.paymentDate)}\nPayment Mode: ${payment.paymentMode || 'N/A'}\nTransaction ID: ${payment.transactionId || 'N/A'}\n\nThis is a digital receipt.`,
                title: `Fee Receipt - ${payment.receiptNumber}`,
              });
            } catch (e) {
              // Fallback - silent
            }
          },
        },
      ]
    );
  };

  if (loading.fees && !fees) {
    return <Loading fullScreen message="Loading fees..." />;
  }

  if (!feeData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
        <View style={styles.emptyContainer}>
          <EmptyState
            title={t('screens.noFeeData')}
            message="Fee information will appear here once it is available."
            icon={<CreditCard size={48} color={themeColors.textTertiary} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return themeColors.success || '#22c55e';
      case 'pending':
      case 'partial':
        return themeColors.warning || '#f59e0b';
      case 'overdue':
        return themeColors.error || '#ef4444';
      default:
        return themeColors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle size={16} color={getStatusColor(status)} />;
      case 'pending':
      case 'partial':
        return <Clock size={16} color={getStatusColor(status)} />;
      case 'overdue':
        return <AlertCircle size={16} color={getStatusColor(status)} />;
      default:
        return null;
    }
  };

  const displayPayments = showAllPayments ? feeData.payments : feeData.payments.slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Fee Summary */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: themeColors.textSecondary }]}>
                Total Fees
              </Text>
              <Text style={[styles.totalAmount, { color: themeColors.text }]}>
                {formatCurrency(feeData.totalFee)}
              </Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                  Paid
                </Text>
                <Text style={[styles.summaryStatValue, { color: themeColors.success || '#22c55e' }]}>
                  {formatCurrency(feeData.paid)}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                  Balance
                </Text>
                <Text style={[styles.summaryStatValue, { color: feeData.balance > 0 ? (themeColors.error || '#ef4444') : themeColors.text }]}>
                  {formatCurrency(feeData.balance)}
                </Text>
              </View>
              {feeData.discount > 0 && (
                <>
                  <View style={[styles.summaryDivider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.summaryStat}>
                    <Text style={[styles.summaryStatLabel, { color: themeColors.textSecondary }]}>
                      Discount
                    </Text>
                    <Text style={[styles.summaryStatValue, { color: themeColors.info || '#3b82f6' }]}>
                      {formatCurrency(feeData.discount)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${feeData.paidPercentage}%`,
                    backgroundColor: themeColors.text,
                  },
                ]}
              />
            </View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
                {feeData.paidPercentage}% paid
              </Text>
              <View style={[styles.statusChip, { backgroundColor: getStatusColor(feeData.status) + '20' }]}>
                {getStatusIcon(feeData.status)}
                <Text style={[styles.statusChipText, { color: getStatusColor(feeData.status) }]}>
                  {feeData.status.charAt(0).toUpperCase() + feeData.status.slice(1)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Pay Now Button */}
          {feeData.balance > 0 && (
            <Button
              title={`Pay Balance (${formatCurrency(feeData.balance)})`}
              onPress={() => navigation.navigate('Payment')}
              style={styles.payButton}
              icon={<CreditCard size={18} color={themeColors.textInverse} />}
            />
          )}

          {/* Fee Structure */}
          {feeData.feeHeads.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => setShowFeeStructure(!showFeeStructure)}
              >
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Fee Structure
                </Text>
                {showFeeStructure
                  ? <ChevronUp size={20} color={themeColors.textSecondary} />
                  : <ChevronDown size={20} color={themeColors.textSecondary} />
                }
              </TouchableOpacity>

              {showFeeStructure && (
                <Card style={styles.feeStructureCard}>
                  {/* Header */}
                  <View style={[styles.feeStructureRow, styles.feeStructureHeader, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.feeHeadName, styles.feeHeaderText, { color: themeColors.textSecondary }]}>{t('screens.feeHead')}</Text>
                    <Text style={[styles.feeHeadAmount, styles.feeHeaderText, { color: themeColors.textSecondary }]}>{t('screens.amount1')}</Text>
                    <Text style={[styles.feeHeadPaid, styles.feeHeaderText, { color: themeColors.textSecondary }]}>{t('screens.paid1')}</Text>
                    <Text style={[styles.feeHeadStatus, styles.feeHeaderText, { color: themeColors.textSecondary }]}>{t('screens.status')}</Text>
                  </View>

                  {feeData.feeHeads.map((head, index) => (
                    <View
                      key={head.feeHeadId || index}
                      style={[
                        styles.feeStructureRow,
                        index < feeData.feeHeads.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.borderLight || '#f0f0f0' },
                      ]}
                    >
                      <View style={styles.feeHeadName}>
                        <Text style={[styles.feeHeadNameText, { color: themeColors.text }]} numberOfLines={1}>
                          {head.name}
                        </Text>
                        {head.frequency && (
                          <Text style={[styles.feeFrequency, { color: themeColors.textTertiary }]}>
                            {head.frequency}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.feeHeadAmount, { color: themeColors.text }]}>
                        {formatCurrency(head.amount)}
                      </Text>
                      <Text style={[styles.feeHeadPaid, { color: themeColors.success || '#22c55e' }]}>
                        {formatCurrency(head.paidAmount || 0)}
                      </Text>
                      <View style={[styles.feeHeadStatus, { alignItems: 'center' }]}>
                        <View style={[styles.miniStatusBadge, { backgroundColor: getStatusColor(head.status) + '20' }]}>
                          <Text style={[styles.miniStatusText, { color: getStatusColor(head.status) }]}>
                            {head.status ? head.status.charAt(0).toUpperCase() + head.status.slice(1) : '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* Total Row */}
                  <View style={[styles.feeStructureRow, styles.feeTotalRow, { borderTopColor: themeColors.border }]}>
                    <Text style={[styles.feeHeadName, styles.feeTotalText, { color: themeColors.text }]}>{t('screens.total')}</Text>
                    <Text style={[styles.feeHeadAmount, styles.feeTotalText, { color: themeColors.text }]}>
                      {formatCurrency(feeData.totalFee)}
                    </Text>
                    <Text style={[styles.feeHeadPaid, styles.feeTotalText, { color: themeColors.success || '#22c55e' }]}>
                      {formatCurrency(feeData.paid)}
                    </Text>
                    <Text style={[styles.feeHeadStatus, styles.feeTotalText, { color: themeColors.text }]}></Text>
                  </View>
                </Card>
              )}
            </>
          )}

          {/* Payment History */}
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 8 }]}>
            Payment History
          </Text>

          {feeData.payments.length > 0 ? (
            <>
              {displayPayments.map((payment, index) => (
                <Card key={payment._id || payment.id || index} style={styles.historyCard}>
                  <View style={styles.historyItem}>
                    <View style={[styles.historyIcon, { backgroundColor: themeColors.backgroundSecondary }]}>
                      <CheckCircle size={18} color={themeColors.success || '#22c55e'} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyAmount, { color: themeColors.text }]}>
                        {formatCurrency(payment.amount)}
                      </Text>
                      <Text style={[styles.historyDate, { color: themeColors.textSecondary }]}>
                        {formatDate(payment.paymentDate)}
                      </Text>
                      {payment.feeHeads?.length > 0 && (
                        <Text style={[styles.historyFeeHeads, { color: themeColors.textTertiary }]} numberOfLines={1}>
                          {payment.feeHeads.map(h => h.name).join(', ')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.historyMeta}>
                      <Text style={[styles.historyMethod, { color: themeColors.textSecondary }]}>
                        {payment.paymentMode || payment.method || '-'}
                      </Text>
                      <Text style={[styles.historyReceipt, { color: themeColors.textTertiary }]}>
                        #{payment.receiptNumber || payment.receiptNo || '-'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.downloadBtn, { backgroundColor: themeColors.backgroundSecondary }]}
                        onPress={() => handleDownloadInvoice(payment)}
                      >
                        <Download size={14} color={themeColors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}

              {feeData.payments.length > 5 && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => setShowAllPayments(!showAllPayments)}
                >
                  <Text style={[styles.showMoreText, { color: themeColors.textSecondary }]}>
                    {showAllPayments ? 'Show Less' : `Show All (${feeData.payments.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Card style={styles.emptyPayments}>
              <Text style={[styles.emptyPaymentsText, { color: themeColors.textTertiary }]}>
                No payment records found.
              </Text>
            </Card>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  payButton: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  feeStructureCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  feeStructureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feeStructureHeader: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  feeHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feeHeadName: {
    flex: 3,
  },
  feeHeadNameText: {
    fontSize: 13,
    fontWeight: '500',
  },
  feeFrequency: {
    fontSize: 10,
    marginTop: 1,
  },
  feeHeadAmount: {
    flex: 2,
    fontSize: 13,
    textAlign: 'right',
  },
  feeHeadPaid: {
    flex: 2,
    fontSize: 13,
    textAlign: 'right',
  },
  feeHeadStatus: {
    flex: 2,
    fontSize: 12,
    textAlign: 'center',
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  feeTotalRow: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  feeTotalText: {
    fontWeight: '700',
    fontSize: 14,
  },
  historyCard: {
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
  },
  historyFeeHeads: {
    fontSize: 11,
    marginTop: 2,
  },
  historyMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyMethod: {
    fontSize: 12,
  },
  historyReceipt: {
    fontSize: 11,
  },
  downloadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyPayments: {
    padding: 24,
    alignItems: 'center',
  },
  emptyPaymentsText: {
    fontSize: 14,
  },
});

export default FeesScreen;
