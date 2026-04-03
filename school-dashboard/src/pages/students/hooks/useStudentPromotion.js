/**
 * useStudentPromotion
 * Extracted from StudentDashboard.jsx — handles student promotion logic.
 */
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { getNextClass } from '../utils/studentHelpers';
import { useTranslation } from 'react-i18next';

/**
 * @param {Object} student - The student to promote
 * @param {Array} classesWithTeachers - Available classes
 * @param {Function} updateStudent - API call to update student
 * @param {Function} refetchStudent - Refetch student data after promotion
 */
export function useStudentPromotion(student, { classesWithTeachers, updateStudent, refetchStudent } = {}) {
  const { t } = useTranslation();

  const availableClasses = (classesWithTeachers || []).map(cls => `${cls.name}-${cls.section}`);

  const resolveClassId = useCallback((classString) => {
    const classMatch = classString.match(/^(\d+|[A-Za-z]+)(?:-([A-Z]))?$/i);
    if (!classMatch) return null;
    const [, grade, section = ''] = classMatch;
    const target = (classesWithTeachers || []).find(
      cls => String(cls.name) === String(grade) && (cls.section || '') === String(section)
    );
    return target?._id || target?.id || null;
  }, [classesWithTeachers]);

  const handlePromoteStudent = useCallback(async (onSuccess) => {
    const nextClass = getNextClass(student?.class, availableClasses);
    if (!nextClass) {
      toast.error(t('toast.error.unableToCalculateNextClass'));
      return;
    }

    try {
      const loadingToast = toast.loading(
        t('toast.loading.promotingStudent', {
          name: student.name,
          class: nextClass,
          defaultValue: `Promoting ${student.name} to ${nextClass}...`,
        })
      );

      if (nextClass === 'Passed Out / Alumni') {
        await updateStudent(student.id, { status: 'alumni' });
      } else {
        const classId = resolveClassId(nextClass);
        if (classId) {
          await updateStudent(student.id, { classId, class: nextClass });
        } else {
          toast.error(
            t('toast.error.classNotFound', {
              class: nextClass,
              defaultValue: `Target class "${nextClass}" not found. Create the class first.`,
            }),
            { id: loadingToast }
          );
          return;
        }
      }

      toast.success(
        t('toast.success.studentPromoted', {
          name: student.name,
          class: nextClass,
          defaultValue: `${student.name} promoted to ${nextClass}`,
        }),
        { id: loadingToast }
      );
      refetchStudent?.();
      onSuccess?.();
    } catch (e) {
      toast.error('Failed to promote student: ' + (e.message || 'Unknown error'));
    }
  }, [student, availableClasses, classesWithTeachers, updateStudent, refetchStudent, resolveClassId, t]);

  return {
    availableClasses,
    nextClass: student?.class ? getNextClass(student.class, availableClasses) : null,
    handlePromoteStudent,
  };
}
