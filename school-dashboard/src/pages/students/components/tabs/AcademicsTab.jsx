import StudentResults from "../StudentResults";
import { useTranslation } from 'react-i18next';

/**
 * AcademicsTab - Tab wrapper for StudentResults component
 */
export default function AcademicsTab({
  results,
  resultsLoading,
  classTeacher,
  onExamSelect
}) {
  return (
    <div className="animate-fade-in">
      <StudentResults
        results={results}
        resultsLoading={resultsLoading}
        classTeacher={classTeacher}
        onExamSelect={onExamSelect}
      />
    </div>
  );
}
