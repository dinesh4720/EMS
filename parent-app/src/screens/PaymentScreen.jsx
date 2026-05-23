import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { useStudent } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components';
import { formatCurrency } from '../utils/helpers';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  CheckCircle,
  Shield,
  X,
} from 'lucide-react-native';

const getDefaultAcademicYear = (referenceDate = new Date()) => {
  const startYear = referenceDate.getMonth() >= 3
    ? referenceDate.getFullYear()
    : referenceDate.getFullYear() - 1;

  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
};

const PaymentScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const { fees, fetchFees } = useStudent();
  const { student, user } = useAuth();

  const [selectedHeads, setSelectedHeads] = useState({});
  const [customAmounts, setCustomAmounts] = useState({});
  const [payFullBalance, setPayFullBalance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const webViewRef = useRef(null);

  const studentId = student?.studentId;

  // Parse fee data
  const feeData = useMemo(() => {
    if (!fees) return null;
    const details = fees.feeDetails || {};
    const totalFee = details.totalFee || 0;
    const paid = details.paidAmount || 0;
    const balance = details.balanceAmount || (totalFee - paid);
    const feeHeads = fees.feeStructure?.feeHeads || [];

    // Only show unpaid fee heads
    const unpaidHeads = feeHeads.filter(h => (h.balanceAmount || (h.amount - (h.paidAmount || 0))) > 0);

    return { totalFee, paid, balance, feeHeads: unpaidHeads };
  }, [fees]);

  // Calculate total selected amount
  const selectedAmount = useMemo(() => {
    if (payFullBalance) return feeData?.balance || 0;

    let total = 0;
    for (const [headId, isSelected] of Object.entries(selectedHeads)) {
      if (isSelected) {
        const head = feeData?.feeHeads.find(h => (h.feeHeadId || h._id) === headId);
        if (head) {
          const balance = head.balanceAmount || (head.amount - (head.paidAmount || 0));
          const custom = customAmounts[headId];
          total += (custom !== undefined && custom !== '') ? parseFloat(custom) || 0 : balance;
        }
      }
    }
    return total;
  }, [payFullBalance, selectedHeads, customAmounts, feeData]);

  // Build fee head payments array for API
  const buildFeeHeadPayments = () => {
    if (payFullBalance) {
      return feeData.feeHeads.map(h => ({
        feeHeadId: h.feeHeadId || h._id,
        name: h.name,
        amount: h.balanceAmount || (h.amount - (h.paidAmount || 0)),
      }));
    }

    const payments = [];
    for (const [headId, isSelected] of Object.entries(selectedHeads)) {
      if (isSelected) {
        const head = feeData.feeHeads.find(h => (h.feeHeadId || h._id) === headId);
        if (head) {
          const balance = head.balanceAmount || (head.amount - (head.paidAmount || 0));
          const custom = customAmounts[headId];
          const amt = (custom !== undefined && custom !== '') ? parseFloat(custom) || 0 : balance;
          if (amt > 0) {
            payments.push({
              feeHeadId: headId,
              name: head.name,
              amount: amt,
            });
          }
        }
      }
    }
    return payments;
  };

  const toggleHead = (headId) => {
    setSelectedHeads(prev => ({ ...prev, [headId]: !prev[headId] }));
  };

  const handleProceedToPay = async () => {
    if (selectedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please select fee heads or enter a valid amount to pay.');
      return;
    }

    // Validate custom amounts don't exceed balance
    if (!payFullBalance) {
      for (const [headId, isSelected] of Object.entries(selectedHeads)) {
        if (isSelected && customAmounts[headId]) {
          const head = feeData.feeHeads.find(h => (h.feeHeadId || h._id) === headId);
          if (head) {
            const balance = head.balanceAmount || (head.amount - (head.paidAmount || 0));
            const custom = parseFloat(customAmounts[headId]);
            if (custom > balance) {
              Alert.alert('Invalid Amount', `Amount for "${head.name}" cannot exceed ₹${balance}`);
              return;
            }
            if (custom <= 0) {
              Alert.alert('Invalid Amount', `Amount for "${head.name}" must be greater than 0`);
              return;
            }
          }
        }
      }
    }

    setLoading(true);
    try {
      const feeHeadPayments = buildFeeHeadPayments();
      const academicYear = fees?.feeStructure?.feeHeads?.[0]?.academicYear || getDefaultAcademicYear();
      const response = await api.createPaymentOrder(studentId, {
        amount: selectedAmount,
        feeHeadPayments,
        academicYear,
      });

      if (response.success) {
        setOrderData(response.data);
        setShowRazorpay(true);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create payment order');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    setShowRazorpay(false);
    setLoading(true);

    try {
      const feeHeadPayments = buildFeeHeadPayments();
      const academicYear = fees?.feeStructure?.feeHeads?.[0]?.academicYear || getDefaultAcademicYear();
      const response = await api.verifyPayment(studentId, {
        razorpay_order_id: paymentData.razorpay_order_id || orderData.orderId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        amount: selectedAmount,
        feeHeadPayments,
        academicYear,
        mock: orderData?.mock || false,
      });

      if (response.success) {
        setPaymentSuccess(response.data);
        // Refresh fee data
        await fetchFees();
      } else {
        Alert.alert('Verification Failed', response.error?.message || 'Payment verification failed. Please contact the school.');
      }
    } catch (error) {
      Alert.alert(
        'Verification Error',
        'Payment was received but verification encountered an issue. Your payment will be confirmed shortly. If not, please contact the school office.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = (error) => {
    setShowRazorpay(false);
    Alert.alert(
      'Payment Failed',
      error?.description || 'Payment was cancelled or failed. No amount has been deducted.',
      [{ text: 'OK' }]
    );
  };

  // Generate Razorpay checkout HTML
  const getRazorpayHTML = () => {
    if (!orderData) return '';

    const { orderId, amountInPaise, currency, keyId, studentName, notes, mock } = orderData;

    // For mock/dev mode, show a simple confirmation page
    if (mock) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
            .card { background: white; border-radius: 16px; padding: 32px 24px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
            h2 { font-size: 20px; margin-bottom: 8px; color: #1a1a1a; }
            .amount { font-size: 36px; font-weight: 700; color: #1a1a1a; margin: 16px 0; }
            .info { color: #666; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
            .dev-badge { background: #fff3cd; color: #856404; padding: 8px 16px; border-radius: 8px; font-size: 12px; margin-bottom: 24px; display: inline-block; }
            .btn { display: block; width: 100%; padding: 16px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 12px; }
            .btn-primary { background: #1a1a1a; color: white; }
            .btn-secondary { background: #f0f0f0; color: #333; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="dev-badge">{t('screens.developmentMode')}</div>
            <h2>{t('screens.feePayment')}</h2>
            <p class="info">Student: ${studentName || ''}</p>
            <div class="amount">₹${(amountInPaise / 100).toLocaleString('en-IN')}</div>
            <p class="info">{t('screens.thisIsATestPaymentInProductionRazorpayCheckoutWillAppearHere')}</p>
            <button class="btn btn-primary" onclick="simulateSuccess()">{t('screens.simulateSuccessfulPayment')}</button>
            <button class="btn btn-secondary" onclick="simulateFailure()">{t('screens.cancel1')}</button>
          </div>
          <script>
            function simulateSuccess() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_success',
                data: {
                  razorpay_order_id: '${orderId}',
                  razorpay_payment_id: 'pay_mock_' + Date.now(),
                  razorpay_signature: 'mock_signature_' + Date.now(),
                }
              }));
            }
            function simulateFailure() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_failure',
                data: { description: 'Payment cancelled by user' }
              }));
            }
          </script>
        </body>
        </html>
      `;
    }

    // Real Razorpay checkout
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, system-ui, sans-serif; }
          .loading { text-align: center; color: #666; }
          .loading p { margin-top: 16px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="loading">
          <p>{t('screens.openingPaymentGateway')}</p>
        </div>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          var options = {
            key: '${keyId}',
            amount: ${amountInPaise},
            currency: '${currency || 'INR'}',
            name: 'School Fee Payment',
            description: 'Fee payment for ${studentName || 'Student'}',
            order_id: '${orderId}',
            prefill: {
              name: '${user?.name || ''}',
              email: '${user?.email || ''}',
              contact: '${user?.phone || ''}'
            },
            notes: ${JSON.stringify(notes || {})},
            theme: { color: '#1a1a1a' },
            handler: function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_success',
                data: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }
              }));
            },
            modal: {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_failure',
                  data: { description: 'Payment cancelled by user' }
                }));
              }
            }
          };

          var rzp = new Razorpay(options);
          rzp.on('payment.failed', function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'payment_failure',
              data: {
                code: response.error.code,
                description: response.error.description,
                reason: response.error.reason,
              }
            }));
          });
          rzp.open();
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'payment_success') {
        handlePaymentSuccess(message.data);
      } else if (message.type === 'payment_failure') {
        handlePaymentFailure(message.data);
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  // Payment Success Screen
  if (paymentSuccess) {
    const payment = paymentSuccess.payment;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: (themeColors.success || '#22c55e') + '15' }]}>
            <CheckCircle size={64} color={themeColors.success || '#22c55e'} />
          </View>

          <Text style={[styles.successTitle, { color: themeColors.text }]}>
            Payment Successful!
          </Text>
          <Text style={[styles.successSubtitle, { color: themeColors.textSecondary }]}>
            Your fee payment has been received
          </Text>

          <Card style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>{t('screens.amountPaid')}</Text>
              <Text style={[styles.receiptValue, styles.receiptAmount, { color: themeColors.success || '#22c55e' }]}>
                {formatCurrency(payment?.amount)}
              </Text>
            </View>
            <View style={[styles.receiptDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>{t('screens.receiptNo')}</Text>
              <Text style={[styles.receiptValue, { color: themeColors.text }]}>
                {payment?.receiptNumber || '-'}
              </Text>
            </View>
            <View style={[styles.receiptDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>{t('screens.transactionId')}</Text>
              <Text style={[styles.receiptValue, { color: themeColors.text }]} numberOfLines={1}>
                {payment?.transactionId || '-'}
              </Text>
            </View>
            <View style={[styles.receiptDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>{t('screens.date')}</Text>
              <Text style={[styles.receiptValue, { color: themeColors.text }]}>
                {payment?.paymentDate || new Date().toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.receiptDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>{t('screens.paymentMode')}</Text>
              <Text style={[styles.receiptValue, { color: themeColors.text }]}>{t('screens.online')}</Text>
            </View>

            {paymentSuccess.updatedFeeDetails && (
              <>
                <View style={[styles.receiptDivider, { backgroundColor: themeColors.border, marginVertical: 12 }]} />
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: themeColors.textSecondary }]}>{t('screens.remainingBalance')}</Text>
                  <Text style={[styles.receiptValue, {
                    color: paymentSuccess.updatedFeeDetails.balanceAmount > 0
                      ? (themeColors.error || '#ef4444')
                      : (themeColors.success || '#22c55e'),
                    fontWeight: '700',
                  }]}>
                    {formatCurrency(paymentSuccess.updatedFeeDetails.balanceAmount)}
                  </Text>
                </View>
              </>
            )}
          </Card>

          <Button
            title={t('screens.backToFees')}
            onPress={() => navigation.goBack()}
            style={styles.doneButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!feeData || feeData.balance <= 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.emptyContainer}>
          <CheckCircle size={48} color={themeColors.success || '#22c55e'} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{t('screens.allFeesPaid')}</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            There are no pending fees to pay.
          </Text>
          <Button title={t('screens.goBack')} onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Balance Summary */}
          <Card style={styles.balanceCard}>
            <Text style={[styles.balanceLabel, { color: themeColors.textSecondary }]}>
              Outstanding Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: themeColors.error || '#ef4444' }]}>
              {formatCurrency(feeData.balance)}
            </Text>
            <Text style={[styles.balanceSub, { color: themeColors.textTertiary }]}>
              Total: {formatCurrency(feeData.totalFee)} · Paid: {formatCurrency(feeData.paid)}
            </Text>
          </Card>

          {/* Payment Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                {
                  backgroundColor: payFullBalance ? themeColors.text : themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => setPayFullBalance(true)}
            >
              <Text style={[styles.modeText, { color: payFullBalance ? themeColors.textInverse : themeColors.text }]}>
                Pay Full Balance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeOption,
                {
                  backgroundColor: !payFullBalance ? themeColors.text : themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                setPayFullBalance(false);
                // Auto-select all heads
                const allSelected = {};
                feeData.feeHeads.forEach(h => {
                  allSelected[h.feeHeadId || h._id] = true;
                });
                setSelectedHeads(allSelected);
              }}
            >
              <Text style={[styles.modeText, { color: !payFullBalance ? themeColors.textInverse : themeColors.text }]}>
                Select Fee Heads
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fee Head Selection (when not paying full balance) */}
          {!payFullBalance && feeData.feeHeads.length > 0 && (
            <View style={styles.feeHeadsSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Select Fees to Pay
              </Text>

              {feeData.feeHeads.map((head) => {
                const headId = head.feeHeadId || head._id;
                const balance = head.balanceAmount || (head.amount - (head.paidAmount || 0));
                const isSelected = selectedHeads[headId];

                return (
                  <Card key={headId} style={[styles.feeHeadCard, isSelected && { borderColor: themeColors.text, borderWidth: 1.5 }]}>
                    <TouchableOpacity
                      style={styles.feeHeadRow}
                      onPress={() => toggleHead(headId)}
                    >
                      <View style={[
                        styles.checkbox,
                        {
                          borderColor: isSelected ? themeColors.text : themeColors.border,
                          backgroundColor: isSelected ? themeColors.text : 'transparent',
                        }
                      ]}>
                        {isSelected && <CheckCircle size={14} color={themeColors.textInverse} />}
                      </View>

                      <View style={styles.feeHeadInfo}>
                        <Text style={[styles.feeHeadName, { color: themeColors.text }]}>
                          {head.name}
                        </Text>
                        {head.frequency && (
                          <Text style={[styles.feeHeadFreq, { color: themeColors.textTertiary }]}>
                            {head.frequency}
                          </Text>
                        )}
                      </View>

                      <View style={styles.feeHeadAmounts}>
                        <Text style={[styles.feeHeadBalance, { color: themeColors.error || '#ef4444' }]}>
                          {formatCurrency(balance)}
                        </Text>
                        <Text style={[styles.feeHeadTotal, { color: themeColors.textTertiary }]}>
                          of {formatCurrency(head.amount)}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Custom amount input */}
                    {isSelected && (
                      <View style={[styles.customAmountRow, { borderTopColor: themeColors.border }]}>
                        <Text style={[styles.customAmountLabel, { color: themeColors.textSecondary }]}>
                          Pay amount:
                        </Text>
                        <View style={[styles.customAmountInput, { borderColor: themeColors.border, backgroundColor: themeColors.backgroundSecondary }]}>
                          <Text style={[styles.currencySymbol, { color: themeColors.textSecondary }]}>₹</Text>
                          <TextInput
                            style={[styles.amountInput, { color: themeColors.text }]}
                            value={customAmounts[headId]?.toString() || ''}
                            onChangeText={(text) => {
                              const num = text.replace(/[^0-9.]/g, '');
                              // Clamp to fee head balance — prevent over-payment
                              const parsed = parseFloat(num);
                              if (!isNaN(parsed) && parsed > balance) {
                                setCustomAmounts(prev => ({ ...prev, [headId]: balance.toString() }));
                              } else {
                                setCustomAmounts(prev => ({ ...prev, [headId]: num }));
                              }
                            }}
                            placeholder={balance.toString()}
                            placeholderTextColor={themeColors.textTertiary}
                            keyboardType="numeric"
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => setCustomAmounts(prev => ({ ...prev, [headId]: balance.toString() }))}
                        >
                          <Text style={[styles.fullAmountBtn, { color: themeColors.text }]}>{t('screens.full')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}

          {/* Payment Summary */}
          <Card style={styles.summaryCard}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 12 }]}>
              Payment Summary
            </Text>

            {payFullBalance ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>{t('screens.fullBalance')}</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(feeData.balance)}</Text>
              </View>
            ) : (
              buildFeeHeadPayments().map((fhp, i) => (
                <View key={i} style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]} numberOfLines={1}>{fhp.name}</Text>
                  <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(fhp.amount)}</Text>
                </View>
              ))
            )}

            <View style={[styles.summaryDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: themeColors.text }]}>{t('screens.totalToPay')}</Text>
              <Text style={[styles.summaryTotalValue, { color: themeColors.text }]}>
                {formatCurrency(selectedAmount)}
              </Text>
            </View>
          </Card>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Shield size={14} color={themeColors.textTertiary} />
            <Text style={[styles.securityText, { color: themeColors.textTertiary }]}>
              Payments are secured by Razorpay. Your card details are never stored.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Pay Button */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomLabel, { color: themeColors.textSecondary }]}>{t('screens.total')}</Text>
          <Text style={[styles.bottomAmount, { color: themeColors.text }]}>{formatCurrency(selectedAmount)}</Text>
        </View>
        <Button
          title={loading ? 'Processing...' : 'Pay Now'}
          onPress={handleProceedToPay}
          loading={loading}
          disabled={selectedAmount <= 0 || loading}
          icon={!loading ? <CreditCard size={18} color={themeColors.textInverse} /> : null}
          style={styles.payNowBtn}
        />
      </View>

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showRazorpay}
        animationType="slide"
        onRequestClose={() => {
          setShowRazorpay(false);
          handlePaymentFailure({ description: 'Payment cancelled' });
        }}
      >
        <SafeAreaView style={[styles.webViewContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.webViewHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setShowRazorpay(false);
                handlePaymentFailure({ description: 'Payment cancelled' });
              }}
              style={styles.closeBtn}
            >
              <X size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, { color: themeColors.text }]}>{t('screens.securePayment')}</Text>
            <View style={styles.closeBtn} />
          </View>

          {orderData && (
            <WebView
              ref={webViewRef}
              source={{ html: getRazorpayHTML() }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={themeColors.text} />
                  <Text style={[styles.webViewLoadingText, { color: themeColors.textSecondary }]}>
                    Loading payment gateway...
                  </Text>
                </View>
              )}
              style={styles.webView}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Balance Card
  balanceCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  balanceSub: {
    fontSize: 12,
    marginTop: 6,
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Fee Heads
  feeHeadsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  feeHeadCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feeHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feeHeadInfo: {
    flex: 1,
  },
  feeHeadName: {
    fontSize: 14,
    fontWeight: '500',
  },
  feeHeadFreq: {
    fontSize: 11,
    marginTop: 2,
  },
  feeHeadAmounts: {
    alignItems: 'flex-end',
  },
  feeHeadBalance: {
    fontSize: 15,
    fontWeight: '600',
  },
  feeHeadTotal: {
    fontSize: 11,
    marginTop: 1,
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  customAmountLabel: {
    fontSize: 12,
  },
  customAmountInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  currencySymbol: {
    fontSize: 14,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  fullAmountBtn: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Summary
  summaryCard: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Security
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  securityText: {
    fontSize: 11,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    ...Platform.select({
      ios: { paddingBottom: 28 },
      android: { paddingBottom: 12 },
    }),
  },
  bottomInfo: {},
  bottomLabel: {
    fontSize: 11,
  },
  bottomAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  payNowBtn: {
    paddingHorizontal: 28,
  },

  // Success Screen
  successContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  receiptCard: {
    width: '100%',
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 13,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  receiptAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  receiptDivider: {
    height: StyleSheet.hairlineWidth,
  },
  doneButton: {
    width: '100%',
  },

  // WebView Modal
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default PaymentScreen;
