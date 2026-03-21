import { useState } from 'react';

export function useStudentOverviewModals() {
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFeeStatusOpen, setIsFeeStatusOpen] = useState(false);
  const [isParentAppOpen, setIsParentAppOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);

  return {
    isAttendanceOpen, setIsAttendanceOpen,
    isFeeStatusOpen, setIsFeeStatusOpen,
    isParentAppOpen, setIsParentAppOpen,
    isEditOpen, setIsEditOpen,
    isPaymentOpen, setIsPaymentOpen,
    isComplaintOpen, setIsComplaintOpen,
    isInvoiceOpen, setIsInvoiceOpen,
    isRemarkOpen, setIsRemarkOpen,
  };
}
