import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../../../context/AppContext";
import { studentFeesApi } from "../../../services/api";

async function fetchStudentFeeStructure(studentId, academicYear, autoInitialize) {
  try {
    const feeStructure = await studentFeesApi.getByStudent(studentId, academicYear);
    return {
      feeStructure,
      exists: true,
    };
  } catch (error) {
    if (error?.status === 404 && autoInitialize) {
      try {
        const initializedStructure = await studentFeesApi.initialize(studentId, academicYear);
        return {
          feeStructure: initializedStructure,
          exists: Boolean(initializedStructure),
        };
      } catch (initError) {
        return {
          feeStructure: null,
          exists: false,
        };
      }
    }

    if (error?.status === 404) {
      return {
        feeStructure: null,
        exists: false,
      };
    }

    throw error;
  }
}

export function useStudentFees(studentId, options = {}) {
  const { currentAcademicYear } = useApp();
  const {
    academicYear = currentAcademicYear,
    autoInitialize = true,
  } = options;

  const feeQuery = useQuery({
    queryKey: ["student-fees", studentId, academicYear, autoInitialize],
    enabled: Boolean(studentId),
    queryFn: () => fetchStudentFeeStructure(studentId, academicYear, autoInitialize),
    retry: (failureCount, error) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  return {
    feeStructure: feeQuery.data?.feeStructure || null,
    loading: feeQuery.isPending,
    error: feeQuery.error?.message || null,
    exists: feeQuery.data?.exists ?? false,
    refetch: feeQuery.refetch,
  };
}

const EMPTY_FEE_STRUCTURES = {};

export function useBatchStudentFees(studentIds, options = {}) {
  const { currentAcademicYear } = useApp();
  const { academicYear = currentAcademicYear } = options;
  // Use sorted join for a lightweight stable key instead of JSON.stringify
  const stableIds = useMemo(() => (studentIds || []).slice().sort(), [studentIds]);
  const idsKey = useMemo(() => stableIds.join(","), [stableIds]);

  const batchQuery = useQuery({
    queryKey: ["student-fees", "batch", academicYear, idsKey],
    enabled: stableIds.length > 0,
    retry: false,
    queryFn: async () => {
      try {
        const batchResult = await studentFeesApi.getBatch(stableIds, academicYear);
        const results = {};
        for (const id of stableIds) {
          if (batchResult[id]) {
            results[id] = { ...batchResult[id], _exists: true };
          } else {
            results[id] = { _exists: false };
          }
        }
        return results;
      } catch {
        return {};
      }
    },
  });

  return {
    feeStructures: batchQuery.data ?? EMPTY_FEE_STRUCTURES,
    loading: batchQuery.isPending,
    error: batchQuery.error?.message || null,
    refetch: batchQuery.refetch,
  };
}
