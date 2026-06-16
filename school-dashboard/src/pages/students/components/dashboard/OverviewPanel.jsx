import React from "react";

import SubjectsCard from "../../../../components/students/SubjectsCard";
import AttendanceHeatmap from "../../../../components/students/AttendanceHeatmap";
import ActivityTimeline from "../../../../components/students/ActivityTimeline";
import ParentCard from "../../../../components/students/ParentCard";
import UpcomingCard from "../../../../components/students/UpcomingCard";
import PersonalCard from "../../../../components/students/PersonalCard";

function OverviewPanel({
  subjects,
  monthAttendance,
  timelineDays,
  parent,
  upcoming,
  student,
  studentId,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: 16,
      }}
      className="student-dashboard__overview-grid"
    >
      <div className="col gap-4">
        <SubjectsCard
          subjects={subjects.slice(0, 5)}
          gradeBookHref={`/academics?student=${studentId}`}
        />
        <AttendanceHeatmap monthAttendance={monthAttendance} />
        <ActivityTimeline days={timelineDays} />
      </div>
      <div className="col gap-4">
        <ParentCard
          parent={parent}
          onSms={() =>
            parent?.phone && window.open(`sms:${parent.phone}`, "_self")
          }
          onEmail={() =>
            parent?.email && window.open(`mailto:${parent.email}`, "_self")
          }
          onCall={() =>
            parent?.phone && window.open(`tel:${parent.phone}`, "_self")
          }
        />
        <UpcomingCard items={upcoming} />
        <PersonalCard
          dob={student.dob}
          age={student.age}
          gender={student.gender}
          bloodGroup={student.bloodGroup}
          admissionDate={student.admissionDate}
        />
      </div>
    </div>
  );
}

export default OverviewPanel;
