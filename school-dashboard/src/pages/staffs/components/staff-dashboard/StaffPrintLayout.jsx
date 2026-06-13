import PrintLayout from "../../../../components/PrintLayout";
import { getSafeDisplayName } from "../../../../utils/objectIdHelper";

// Each .staff-print-section gets page-break-inside: avoid via staff.css so
// the printer never splits a section header from its content. The wrapper
// keeps using inline styles for color/font to stay independent of dynamic
// theme tokens during print rasterization.
export default function StaffPrintLayout({ staff, monthlyStats, attendanceRate, classTeacherAssignments }) {
  return (
    <PrintLayout>
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '32px', color: '#1a1a1a', maxWidth: '700px' }}>
        <div className="staff-print-section" style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>{getSafeDisplayName(staff, 'code')}</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>
            {Array.isArray(staff.role) ? staff.role.join(', ') : staff.role}
            {staff.department ? ` · ${staff.department}` : ''}
          </p>
        </div>

        <div className="staff-print-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
          {staff.code && <Field label="Staff ID" value={staff.code} />}
          {staff.designation && <Field label="Designation" value={staff.designation} />}
          {staff.email && <Field label="Email" value={staff.email} />}
          {staff.phone && <Field label="Phone" value={staff.phone} />}
          {staff.qualification && <Field label="Qualification" value={staff.qualification} />}
          {staff.joiningDate && <Field label="Joining Date" value={staff.joiningDate} />}
        </div>

        {monthlyStats.total > 0 && (
          <div className="staff-print-section" style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Current Month Attendance</p>
            <p style={{ fontSize: '13px', margin: '0', color: '#4b5563' }}>
              Present: {monthlyStats.present} / {monthlyStats.total} days ({attendanceRate}%)
            </p>
          </div>
        )}

        {classTeacherAssignments.length > 0 && (
          <div className="staff-print-section" style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Class Teacher Assignments</p>
            {classTeacherAssignments.map((cls, i) => (
              <p key={cls._id || cls.id || `class-${i}`} style={{ fontSize: '13px', margin: '0 0 4px 0', color: '#4b5563' }}>
                {cls.name}{cls.section ? ` ${cls.section}` : ''}{cls.studentCount ? ` — ${cls.studentCount} students` : ''}
              </p>
            ))}
          </div>
        )}

        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          Generated on {new Date().toLocaleString()} · SchoolSync
        </p>
      </div>
    </PrintLayout>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{value}</p>
    </div>
  );
}
