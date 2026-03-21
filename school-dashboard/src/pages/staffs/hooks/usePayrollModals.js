import { useState } from 'react';

export function usePayrollModals() {
  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    notes: ''
  });

  // Confirmation modals
  const [runPayrollModalOpen, setRunPayrollModalOpen] = useState(false);
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false);
  const [pendingBulkPay, setPendingBulkPay] = useState(null);

  // Validation modal
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);

  // Reverse modal
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reverseRecord, setReverseRecord] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);

  return {
    paymentModalOpen, setPaymentModalOpen,
    editingRecord, setEditingRecord,
    paymentForm, setPaymentForm,
    runPayrollModalOpen, setRunPayrollModalOpen,
    bulkPayModalOpen, setBulkPayModalOpen,
    pendingBulkPay, setPendingBulkPay,
    validationModalOpen, setValidationModalOpen,
    validationResults, setValidationResults,
    validating, setValidating,
    reverseModalOpen, setReverseModalOpen,
    reverseRecord, setReverseRecord,
    reverseReason, setReverseReason,
    reversing, setReversing,
  };
}
