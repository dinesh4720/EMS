import { useState } from 'react';

export function useStudentBulkOps() {
  const [bulkAction, setBulkAction] = useState("");
  const [promotionPreview, setPromotionPreview] = useState([]);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [validatedStudents, setValidatedStudents] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [tcStudents, setTcStudents] = useState([]);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({ student: null, newStatus: '', action: '' });
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderTargetCount, setReminderTargetCount] = useState(0);

  return {
    bulkAction, setBulkAction,
    promotionPreview, setPromotionPreview,
    csvProcessing, setCsvProcessing,
    csvFile, setCsvFile,
    csvDragActive, setCsvDragActive,
    validatedStudents, setValidatedStudents,
    importProgress, setImportProgress,
    tcStudents, setTcStudents,
    studentToDelete, setStudentToDelete,
    isDeleting, setIsDeleting,
    statusChangeData, setStatusChangeData,
    reminderMessage, setReminderMessage,
    reminderTime, setReminderTime,
    reminderTargetCount, setReminderTargetCount,
  };
}
