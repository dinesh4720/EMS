import { useState } from 'react';
import { toDateInputValue } from '../../../utils/dateFormatter';

export function useGatePassForm() {
  // These 14 form field states:
  const [studentId, setStudentId] = useState(null);
  const [reason, setReason] = useState(null);
  const [otherReason, setOtherReason] = useState('');
  const [leavingDate, setLeavingDate] = useState(toDateInputValue(new Date()));
  const [leavingTime, setLeavingTime] = useState(new Date().toTimeString().slice(0, 5));
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [leavingWith, setLeavingWith] = useState(null);
  const [escortName, setEscortName] = useState('');
  const [escortRelation, setEscortRelation] = useState('');
  const [escortPhone, setEscortPhone] = useState('');
  const [approvedBy, setApprovedBy] = useState(null);
  const [approvedByStaffId, setApprovedByStaffId] = useState(null);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setStudentId(null);
    setReason(null);
    setOtherReason('');
    setLeavingDate(toDateInputValue(new Date()));
    setLeavingTime(new Date().toTimeString().slice(0, 5));
    setExpectedReturnDate('');
    setExpectedReturnTime('');
    setLeavingWith(null);
    setEscortName('');
    setEscortRelation('');
    setEscortPhone('');
    setApprovedBy(null);
    setApprovedByStaffId(null);
    setNotes('');
  };

  const populateForm = (gatePass) => {
    setStudentId(gatePass.studentId || null);
    setReason(gatePass.reason || null);
    setOtherReason(gatePass.otherReason || '');
    setLeavingDate(gatePass.leavingDate || toDateInputValue(new Date()));
    setLeavingTime(gatePass.leavingTime || new Date().toTimeString().slice(0, 5));
    setExpectedReturnDate(gatePass.expectedReturnDate || '');
    setExpectedReturnTime(gatePass.expectedReturnTime || '');
    setLeavingWith(gatePass.leavingWith || null);
    setEscortName(gatePass.escortName || '');
    setEscortRelation(gatePass.escortRelation || '');
    setEscortPhone(gatePass.escortPhone || '');
    setApprovedBy(gatePass.approvedBy || null);
    setApprovedByStaffId(gatePass.approvedByStaffId || null);
    setNotes(gatePass.notes || '');
  };

  return {
    studentId, setStudentId,
    reason, setReason,
    otherReason, setOtherReason,
    leavingDate, setLeavingDate,
    leavingTime, setLeavingTime,
    expectedReturnDate, setExpectedReturnDate,
    expectedReturnTime, setExpectedReturnTime,
    leavingWith, setLeavingWith,
    escortName, setEscortName,
    escortRelation, setEscortRelation,
    escortPhone, setEscortPhone,
    approvedBy, setApprovedBy,
    approvedByStaffId, setApprovedByStaffId,
    notes, setNotes,
    resetForm,
    populateForm,
  };
}
