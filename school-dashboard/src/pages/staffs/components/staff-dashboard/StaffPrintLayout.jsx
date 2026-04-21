import PrintLayout from "../../../../components/PrintLayout";
import { getSafeDisplayName } from "../../../../utils/objectIdHelper";

export default function StaffPrintLayout({ staff, monthlyStats, attendanceRate, classTeacherAssignments }) {
  return (
    <PrintLayout>
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '32px', color: '#1a1a1a', maxWidth: '700px' }}>
        <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>{getSafeDisplayName(staff, 'code')}</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>
            {Array.isArray(staff.role) ? staff.role.join(', ') : staff.role}
            {staff.department ? ` · ${staff.department}` : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
          {staff.code && <div><p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Staff ID</p><p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{staff.code}</p></div>}
          {staff.designation && <div><p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Designation</p><p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{staff.designation}</p></div>}
          {staff.email && <div><p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Email</p><p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{staff.email}</p></div>}
          {staff.phone && <div><p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Phone</p><p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{staff.phone}</p></div>}
          {staff.qualification && <div><p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Qualification</p><p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{staff.qualification}</p></div>}
          {staff.joiningDate && <div><p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Joining Date</p><p style={{ fontSize: '13px', fontWeight: '600', margin: '0' }}>{staff.joiningDate}</p></div>}
        </div>

        {monthlyStats.total > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Current Month Attendance</p>
            <p style={{ fontSize: '13px', margin: '0', color: '#4b5563' }}>
              Present: {monthlyStats.present} / {monthlyStats.total} days ({attendanceRate}%)
            </p>
          </div>
        )}

        {classTeacherAssignments.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Class Teacher Assignments</p>
            {classTeacherAssignments.map((cls, i) => (
              <p key={i} style={{ fontSize: '13px', margin: '0 0 4px 0', color: '#4b5563' }}>
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
