import StudentRemarks from "../StudentRemarks";

/**
 * RemarksTab - Tab wrapper for StudentRemarks component
 */
export default function RemarksTab({
  studentId,
  student,
  remarks,
  remarksLoading,
  remarksCategoryFilter,
  onRemarksChange,
  onCategoryFilterChange
}) {
  return (
    <div className="animate-fade-in">
      <StudentRemarks
        studentId={studentId}
        student={student}
        remarks={remarks}
        remarksLoading={remarksLoading}
        remarksCategoryFilter={remarksCategoryFilter}
        onRemarksChange={onRemarksChange}
        onCategoryFilterChange={onCategoryFilterChange}
      />
    </div>
  );
}
