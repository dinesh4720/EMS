import StudentRatingSystem from "../StudentRatingSystem";
import { useTranslation } from 'react-i18next';

/**
 * RatingsTab - Tab wrapper for StudentRatingSystem component
 */
export default function RatingsTab({
  studentId,
  ratings,
  onRatingChange,
  editable = true
}) {
  return (
    <div className="animate-fade-in">
      <StudentRatingSystem
        studentId={studentId}
        ratings={ratings}
        onRatingChange={onRatingChange}
        editable={editable}
      />
    </div>
  );
}
