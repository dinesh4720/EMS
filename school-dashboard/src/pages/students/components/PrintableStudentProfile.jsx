import { forwardRef, useMemo } from "react";
import { format } from "date-fns";

const PrintableStudentProfile = forwardRef(({ 
  student, 
  results = [], 
  attendanceStats = { present: 0, absent: 0, total: 0, percentage: 0 },
  attendanceData = [],
  studentFeeStructure = {},
  feeHistory = [],
  documents = [],
  remarks = [],
  classTeacher = null
}, ref) => {
  if (!student) return null;

  // Calculate average percentage
  const averagePercentage = results?.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
    : 0;

  // Get performance badge
  const getPerformanceBadge = () => {
    if (averagePercentage >= 90) return { text: "Excellent", color: "#22c55e" };
    if (averagePercentage >= 75) return { text: "Good", color: "#3b82f6" };
    if (averagePercentage >= 60) return { text: "Satisfactory", color: "#f59e0b" };
    if (averagePercentage >= 40) return { text: "Needs Improvement", color: "#ef4444" };
    return { text: "Requires Attention", color: "#dc2626" };
  };

  const performance = getPerformanceBadge();

  // Calculate monthly attendance
  const monthlyAttendance = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthData = attendanceData.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      
      const present = monthData.filter(a => a.status === 'present').length;
      const percentage = monthData.length > 0 ? Math.round((present / monthData.length) * 100) : 0;
      
      return { month, present, total: monthData.length, percentage };
    });
  }, [attendanceData]);

  // Get grade from percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  // Minimalistic Styles
  const styles = {
    container: {
      padding: "12px 8px",
      fontFamily: "Inter, -apple-system, sans-serif",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#fff",
      color: "#171717",
      fontSize: "13px",
      lineHeight: "1.5"
    },
    profileHeader: {
      display: "flex",
      gap: "16px",
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: "1px solid #f0f0f0"
    },
    photoContainer: {
      width: "72px",
      height: "90px",
      borderRadius: "4px",
      overflow: "hidden",
      border: "1px solid #e5e5e5",
      backgroundColor: "#fafafa",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    photo: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    noPhotoText: {
      fontSize: "9px",
      color: "#a3a3a3",
      textAlign: "center"
    },
    profileInfo: {
      flex: 1
    },
    studentName: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#171717",
      margin: "0 0 6px 0"
    },
    profileGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "4px",
      fontSize: "11px"
    },
    label: {
      color: "#737373"
    },
    value: {
      color: "#171717",
      fontWeight: "500"
    },
    section: {
      marginBottom: "14px"
    },
    sectionTitle: {
      fontSize: "11px",
      fontWeight: "600",
      color: "#525252",
      margin: "0 0 8px 0",
      paddingBottom: "4px",
      borderBottom: "1px solid #f0f0f0",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "6px"
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "6px"
    },
    grid4: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "6px"
    },
    field: {
      fontSize: "11px"
    },
    card: {
      padding: "8px",
      backgroundColor: "#fafafa",
      borderRadius: "4px",
      textAlign: "center",
      border: "1px solid #f0f0f0"
    },
    cardLabel: {
      fontSize: "9px",
      color: "#737373",
      marginBottom: "2px"
    },
    cardValue: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#171717"
    },
    cardValueGreen: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#22c55e"
    },
    cardValueRed: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#ef4444"
    },
    badge: {
      display: "inline-block",
      padding: "2px 6px",
      borderRadius: "3px",
      fontSize: "9px",
      fontWeight: "500"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "10px"
    },
    tableHeader: {
      backgroundColor: "#fafafa",
      fontWeight: "500",
      textAlign: "left",
      padding: "6px 4px",
      borderBottom: "1px solid #e5e5e5",
      color: "#525252"
    },
    tableCell: {
      padding: "5px 4px",
      borderBottom: "1px solid #f0f0f0",
      color: "#171717"
    },
    feeSummary: {
      padding: "10px",
      backgroundColor: "#fafafa",
      borderRadius: "4px"
    },
    feeRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 0",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "11px"
    },
    feeTotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0 0 0",
      marginTop: "4px",
      fontSize: "12px",
      fontWeight: "600"
    },
    progressContainer: {
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    progressBar: {
      flex: 1,
      height: "4px",
      backgroundColor: "#e5e5e5",
      borderRadius: "2px",
      overflow: "hidden"
    },
    progressFill: (percentage) => ({
      width: `${Math.min(percentage, 100)}%`,
      height: "100%",
      backgroundColor: percentage >= 75 ? "#22c55e" : percentage >= 50 ? "#f59e0b" : "#ef4444",
      borderRadius: "2px"
    }),
    attendanceBar: {
      display: "flex",
      gap: "2px",
      marginTop: "6px"
    },
    attendanceBarMonth: (percentage) => ({
      flex: 1,
      height: "20px",
      backgroundColor: percentage >= 75 ? "#22c55e" : percentage >= 50 ? "#f59e0b" : "#ef4444",
      borderRadius: "2px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "7px",
      color: "#fff",
      fontWeight: "500"
    }),
    remarkCard: {
      padding: "6px 8px",
      backgroundColor: "#fafafa",
      borderRadius: "3px",
      borderLeft: "2px solid #171717",
      marginBottom: "4px"
    },
    emptyState: {
      padding: "12px",
      textAlign: "center",
      color: "#a3a3a3",
      fontSize: "11px",
      backgroundColor: "#fafafa",
      borderRadius: "4px"
    },
    footer: {
      marginTop: "16px",
      paddingTop: "10px",
      borderTop: "1px solid #e5e5e5",
      textAlign: "center",
      fontSize: "9px",
      color: "#a3a3a3"
    }
  };

  return (
    <div ref={ref} style={styles.container}>
      {/* Profile Header */}
      <div style={styles.profileHeader}>
        <div style={styles.photoContainer}>
          {student.photo ? (
            <img src={student.photo} alt={student.name} style={styles.photo} />
          ) : (
            <span style={styles.noPhotoText}>No photo uploaded</span>
          )}
        </div>
        <div style={styles.profileInfo}>
          <h2 style={styles.studentName}>{student.name}</h2>
          <div style={styles.profileGrid}>
            <div style={styles.field}><span style={styles.label}>ID: </span><span style={styles.value}>{student.admissionId || `ADM${student.id}`}</span></div>
            <div style={styles.field}><span style={styles.label}>Class: </span><span style={styles.value}>{student.class || "N/A"}</span></div>
            <div style={styles.field}><span style={styles.label}>Roll No: </span><span style={styles.value}>{student.rollNo || "N/A"}</span></div>
            <div style={styles.field}><span style={styles.label}>Status: </span><span style={{...styles.value, color: student.status === "active" ? "#22c55e" : "#f59e0b"}}>{student.status || "Active"}</span></div>
            <div style={styles.field}><span style={styles.label}>Teacher: </span><span style={styles.value}>{classTeacher?.name || "N/A"}</span></div>
            <div style={styles.field}>
              <span style={styles.label}>Performance: </span>
              <span style={{...styles.badge, backgroundColor: performance.color + "15", color: performance.color}}>
                {performance.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.section}>
        <div style={styles.grid4}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Academic Avg</div>
            <div style={styles.cardValue}>{averagePercentage > 0 ? `${averagePercentage}%` : "N/A"}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Attendance</div>
            <div style={{...styles.cardValue, color: attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"}}>{attendanceStats.percentage}%</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Fee Balance</div>
            <div style={{...styles.cardValue, color: (studentFeeStructure?.totalBalance || 0) <= 0 ? "#22c55e" : "#ef4444"}}>
              ₹{(studentFeeStructure?.totalBalance || 0).toLocaleString()}
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Grade</div>
            <div style={styles.cardValue}>{averagePercentage > 0 ? getGrade(averagePercentage) : "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Personal Information</h4>
        <div style={styles.grid3}>
          <div style={styles.field}><span style={styles.label}>Name: </span><span style={styles.value}>{student.name || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>DOB: </span><span style={styles.value}>{student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd MMM yyyy") : "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Gender: </span><span style={styles.value}>{student.gender || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Blood Group: </span><span style={styles.value}>{student.bloodGroup || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Nationality: </span><span style={styles.value}>{student.nationality || "Indian"}</span></div>
          <div style={styles.field}><span style={styles.label}>Religion: </span><span style={styles.value}>{student.religion || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Category: </span><span style={styles.value}>{student.category || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Mother Tongue: </span><span style={styles.value}>{student.motherTongue || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Aadhaar: </span><span style={styles.value}>{student.aadhaarNumber || "N/A"}</span></div>
        </div>
      </div>

      {/* Contact Details */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Contact Details</h4>
        <div style={styles.grid2}>
          <div style={{ gridColumn: "1 / -1", ...styles.field }}>
            <span style={styles.label}>Address: </span>
            <span style={styles.value}>
              {student.address ? `${student.address}${student.city ? `, ${student.city}` : ""}${student.state ? `, ${student.state}` : ""}${student.zipCode ? ` - ${student.zipCode}` : ""}` : "N/A"}
            </span>
          </div>
          <div style={styles.field}><span style={styles.label}>Phone: </span><span style={styles.value}>{student.phone || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Email: </span><span style={styles.value}>{student.email || "N/A"}</span></div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Parent/Guardian</h4>
        <div style={styles.grid3}>
          <div style={styles.field}><span style={styles.label}>Name: </span><span style={styles.value}>{student.parentName || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Relation: </span><span style={styles.value}>{student.parentRelationship || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Phone: </span><span style={styles.value}>{student.parentPhone || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Email: </span><span style={styles.value}>{student.parentEmail || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Occupation: </span><span style={styles.value}>{student.parentOccupation || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Emergency: </span><span style={styles.value}>{student.emergencyContactPhone || student.parentPhone || "N/A"}</span></div>
        </div>
      </div>

      {/* Previous Education */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Previous Education</h4>
        <div style={styles.grid2}>
          <div style={styles.field}><span style={styles.label}>Previous School: </span><span style={styles.value}>{student.previousSchool || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>TC Number: </span><span style={styles.value}>{student.tcNumber || "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Admission Date: </span><span style={styles.value}>{student.admissionDate ? format(new Date(student.admissionDate), "dd MMM yyyy") : "N/A"}</span></div>
          <div style={styles.field}><span style={styles.label}>Previous Class: </span><span style={styles.value}>{student.previousClass || "N/A"}</span></div>
        </div>
      </div>

      {/* Additional Information */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Additional Information</h4>
        <div style={styles.grid3}>
          <div style={styles.field}><span style={styles.label}>Transport: </span><span style={{...styles.value, color: student.transportRequired ? "#22c55e" : "#737373"}}>{student.transportRequired ? "Yes" : "No"}</span></div>
          <div style={styles.field}><span style={styles.label}>Hostel: </span><span style={{...styles.value, color: student.hostelRequired ? "#22c55e" : "#737373"}}>{student.hostelRequired ? "Yes" : "No"}</span></div>
          <div style={styles.field}><span style={styles.label}>Medical: </span><span style={styles.value}>{student.medicalConditions || "None"}</span></div>
        </div>
      </div>

      {/* Academic Performance */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Academic Performance</h4>
        
        {results?.length > 0 ? (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Exam</th>
                  <th style={styles.tableHeader}>Date</th>
                  <th style={{...styles.tableHeader, textAlign: "center"}}>Marks</th>
                  <th style={{...styles.tableHeader, textAlign: "center"}}>%</th>
                  <th style={{...styles.tableHeader, textAlign: "center"}}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, i) => (
                  <tr key={i}>
                    <td style={styles.tableCell}>{result.examId?.name || result.examName || `Exam ${i + 1}`}</td>
                    <td style={styles.tableCell}>{result.examId?.startDate ? format(new Date(result.examId.startDate), "dd MMM") : "N/A"}</td>
                    <td style={{...styles.tableCell, textAlign: "center"}}>{result.totalMarks || "-"}/{result.maxMarks || 100}</td>
                    <td style={{...styles.tableCell, textAlign: "center", fontWeight: "500"}}>{result.percentage ? `${Math.round(result.percentage)}%` : "-"}</td>
                    <td style={{...styles.tableCell, textAlign: "center"}}>{result.percentage ? getGrade(result.percentage) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {results[0]?.subjects?.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "10px", fontWeight: "500", color: "#525252", marginBottom: "6px" }}>Subject Performance (Latest)</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Subject</th>
                      <th style={{...styles.tableHeader, textAlign: "center"}}>Marks</th>
                      <th style={{...styles.tableHeader, textAlign: "center"}}>Max</th>
                      <th style={{...styles.tableHeader}}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results[0].subjects.map((subject, i) => (
                      <tr key={i}>
                        <td style={styles.tableCell}>{subject.name}</td>
                        <td style={{...styles.tableCell, textAlign: "center"}}>{subject.marks || 0}</td>
                        <td style={{...styles.tableCell, textAlign: "center"}}>{subject.maxMarks || 100}</td>
                        <td style={styles.tableCell}>
                          <div style={styles.progressContainer}>
                            <div style={styles.progressBar}>
                              <div style={styles.progressFill(subject.marks && subject.maxMarks ? (subject.marks/subject.maxMarks)*100 : 0)} />
                            </div>
                            <span style={{ fontSize: "9px", minWidth: "30px" }}>
                              {subject.marks && subject.maxMarks ? `${Math.round((subject.marks/subject.maxMarks)*100)}%` : "-"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>No exam results available</div>
        )}
      </div>

      {/* Attendance Details */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Attendance</h4>
        
        <div style={styles.grid3}>
          <div style={{...styles.card, borderLeft: "2px solid #22c55e"}}>
            <div style={styles.cardLabel}>Present</div>
            <div style={styles.cardValueGreen}>{attendanceStats.present}</div>
          </div>
          <div style={{...styles.card, borderLeft: "2px solid #ef4444"}}>
            <div style={styles.cardLabel}>Absent</div>
            <div style={styles.cardValueRed}>{attendanceStats.absent}</div>
          </div>
          <div style={{...styles.card, borderLeft: "2px solid #171717"}}>
            <div style={styles.cardLabel}>Percentage</div>
            <div style={{...styles.cardValue, color: attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"}}>{attendanceStats.percentage}%</div>
          </div>
        </div>

        {attendanceData.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "10px", color: "#525252", marginBottom: "4px" }}>Monthly Overview</p>
            <div style={styles.attendanceBar}>
              {monthlyAttendance.map((m, i) => (
                <div key={i} style={styles.attendanceBarMonth(m.percentage)} title={`${m.month}: ${m.percentage}%`}>
                  {m.month.substring(0, 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fee Summary */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Fee Summary</h4>
        
        <div style={styles.feeSummary}>
          {studentFeeStructure?.feeHeads?.length > 0 && (
            <table style={{...styles.table, marginBottom: "10px"}}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Fee Head</th>
                  <th style={{...styles.tableHeader, textAlign: "right"}}>Amount</th>
                  <th style={{...styles.tableHeader, textAlign: "right"}}>Paid</th>
                  <th style={{...styles.tableHeader, textAlign: "right"}}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {studentFeeStructure.feeHeads.map((fee, i) => (
                  <tr key={i}>
                    <td style={styles.tableCell}>{fee.name}</td>
                    <td style={{...styles.tableCell, textAlign: "right"}}>₹{(fee.amount || 0).toLocaleString()}</td>
                    <td style={{...styles.tableCell, textAlign: "right", color: "#22c55e"}}>₹{(fee.paidAmount || 0).toLocaleString()}</td>
                    <td style={{...styles.tableCell, textAlign: "right", color: fee.balanceAmount > 0 ? "#ef4444" : "#22c55e"}}>₹{(fee.balanceAmount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={styles.feeRow}>
            <span style={styles.label}>Total Fee:</span>
            <span>₹{(studentFeeStructure?.totalFee || 0).toLocaleString()}</span>
          </div>
          <div style={styles.feeRow}>
            <span style={styles.label}>Paid:</span>
            <span style={{ color: "#22c55e" }}>₹{(studentFeeStructure?.totalPaid || 0).toLocaleString()}</span>
          </div>
          {(studentFeeStructure?.discountApplied || 0) > 0 && (
            <div style={styles.feeRow}>
              <span style={styles.label}>Discount:</span>
              <span style={{ color: "#3b82f6" }}>₹{(studentFeeStructure?.discountApplied || 0).toLocaleString()}</span>
            </div>
          )}
          <div style={styles.feeTotal}>
            <span>{(studentFeeStructure?.totalBalance || 0) <= 0 ? "Total Paid" : "Outstanding"}</span>
            <span style={{ color: (studentFeeStructure?.totalBalance || 0) <= 0 ? "#22c55e" : "#ef4444" }}>
              ₹{(studentFeeStructure?.totalBalance || 0) <= 0
                ? (studentFeeStructure?.totalPaid || 0).toLocaleString()
                : (studentFeeStructure?.totalBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {feeHistory?.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "10px", fontWeight: "500", color: "#525252", marginBottom: "6px" }}>Recent Payments</p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Receipt</th>
                  <th style={styles.tableHeader}>Date</th>
                  <th style={{...styles.tableHeader, textAlign: "center"}}>Mode</th>
                  <th style={{...styles.tableHeader, textAlign: "right"}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {feeHistory.slice(0, 4).map((payment, i) => (
                  <tr key={payment.id || i}>
                    <td style={styles.tableCell}>{payment.receiptNumber || `RCP-${i + 1}`}</td>
                    <td style={styles.tableCell}>{payment.paymentDate ? format(new Date(payment.paymentDate), "dd MMM") : "-"}</td>
                    <td style={{...styles.tableCell, textAlign: "center"}}>{payment.paymentMode || "Cash"}</td>
                    <td style={{...styles.tableCell, textAlign: "right", color: "#22c55e"}}>₹{(payment.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documents */}
      {documents?.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Documents ({documents.length})</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Name</th>
                <th style={styles.tableHeader}>Type</th>
                <th style={{...styles.tableHeader, textAlign: "center"}}>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={doc.id || i}>
                  <td style={styles.tableCell}>{doc.name || doc.originalName || `Document ${i + 1}`}</td>
                  <td style={styles.tableCell}>{doc.type || doc.category || "General"}</td>
                  <td style={{...styles.tableCell, textAlign: "center"}}>{doc.uploadedAt ? format(new Date(doc.uploadedAt), "dd MMM") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remarks */}
      {remarks?.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Remarks ({remarks.length})</h4>
          {remarks.slice(0, 4).map((remark, i) => (
            <div key={remark.id || i} style={styles.remarkCard}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ fontSize: "9px", fontWeight: "500", color: "#525252" }}>{remark.category || "General"}</span>
                <span style={{ fontSize: "9px", color: "#a3a3a3" }}>{remark.date ? format(new Date(remark.date), "dd MMM") : ""}</span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "#171717" }}>{remark.remark || remark.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student Ratings */}
      {student?.ratings && Object.keys(student.ratings).length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Ratings</h4>
          <div style={styles.grid2}>
            {Object.entries(student.ratings).map(([key, rating]) => (
              <div key={key} style={{ padding: "6px 8px", backgroundColor: "#fafafa", borderRadius: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "#525252", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ fontSize: "11px", color: "#f59e0b" }}>
                    {"★".repeat(rating.score || rating.value || 0)}{"☆".repeat(5 - (rating.score || rating.value || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {student?.achievements?.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Achievements</h4>
          <div style={styles.grid2}>
            {student.achievements.map((achievement, i) => (
              <div key={i} style={{ padding: "6px 8px", backgroundColor: "#fafafa", borderRadius: "3px", borderLeft: "2px solid #f59e0b" }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: "500", color: "#171717" }}>{achievement.title || achievement}</p>
                {achievement.date && <p style={{ margin: "2px 0 0 0", fontSize: "9px", color: "#737373" }}>{achievement.date}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
});

PrintableStudentProfile.displayName = "PrintableStudentProfile";

export default PrintableStudentProfile;