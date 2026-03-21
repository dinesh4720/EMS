import { useState } from 'react';

export function useStudentRemarks() {
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksCategoryFilter, setRemarksCategoryFilter] = useState('all');

  return {
    remarks, setRemarks,
    remarksLoading, setRemarksLoading,
    remarksCategoryFilter, setRemarksCategoryFilter,
  };
}
