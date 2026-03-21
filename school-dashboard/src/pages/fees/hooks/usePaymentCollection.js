import { useState } from 'react';

export function usePaymentCollection() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  return {
    selectedStudent, setSelectedStudent,
    selectedFees, setSelectedFees,
    paymentMode, setPaymentMode,
    collectingPayment, setCollectingPayment,
    receiptModalOpen, setReceiptModalOpen,
    receiptData, setReceiptData,
  };
}
