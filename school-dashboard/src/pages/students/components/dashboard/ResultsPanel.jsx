import React from "react";
import { BookOpen } from "lucide-react";

import SubjectsCard from "../../../../components/students/SubjectsCard";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import { buildSubjects } from "./utils";

function ResultsPanel({ studentId, results, loading, error, refetch }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading results…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const subjects = buildSubjects(results);
  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No results published"
        description="Subject grades will appear here after the term exam is published."
      />
    );
  }
  return (
    <SubjectsCard
      subjects={subjects}
      gradeBookHref={`/academics?student=${studentId}`}
    />
  );
}

export default ResultsPanel;
