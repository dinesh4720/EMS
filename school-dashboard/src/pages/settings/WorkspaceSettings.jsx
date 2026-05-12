import AcademicYearSelector from "../../components/AcademicYearSelector";
import { useApp } from "../../context/AppContext";

// TODO: replace this single global control with contextual year filters
// per page (each list/report should pick its own range, with a "use
// workspace default" option). The global selector here is a stop-gap
// until per-page filters land.
export default function WorkspaceSettings() {
  const { currentAcademicYear, selectedAcademicYear } = useApp();
  const isNonCurrent =
    selectedAcademicYear && selectedAcademicYear !== currentAcademicYear;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-fg">
          Workspace
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          Defaults that scope what you see across the dashboard.
        </p>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-medium text-fg">
            Academic year
          </h3>
          {isNonCurrent && (
            <span className="text-xs font-medium text-warn">
              Viewing historical year
            </span>
          )}
        </div>
        <p className="text-sm text-fg-muted mb-3">
          Lists and reports filter by this year. Switch to a past year to
          inspect historical data; the current year stays the default for
          everyone else in your school.
        </p>
        <AcademicYearSelector />
      </section>
    </div>
  );
}
