import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Alert from "../../../../components/ui/Alert";
import { sid } from "../../utils/attendanceConstants";

/** Footer alert listing today's absentees as quick-nav chips. */
export default function AbsenteesAlert({ absentCount, classStudents, attendance }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (absentCount <= 0) return null;
  return (
    <Alert variant="danger" title={t('pages.absenteesToday')} className="mx-6 mt-2">
      <div className="flex flex-wrap gap-2 mt-2">
        {classStudents.filter(s => attendance[sid(s)] === 'absent').map(s => (
          <button
            key={sid(s)}
            type="button"
            className="chip"
            onClick={() => navigate(`/students/${sid(s)}`)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </Alert>
  );
}
