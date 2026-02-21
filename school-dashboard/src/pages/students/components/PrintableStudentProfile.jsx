import { forwardRef } from "react";
import { format } from "date-fns";
import PhotoAvatar from "../../../components/PhotoAvatar";

const PrintableStudentProfile = forwardRef(({ student, results, attendanceStats, studentFeeStructure }, ref) => {
  if (!student) return null;

  // Calculate average percentage
  const averagePercentage = results?.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
    : 0;

  // Get performance badge
  const getPerformanceBadge = () => {
    if (averagePercentage >= 90) return { text: "Very Good", color: "#10b981" };
    if (averagePercentage >= 75) return { text: "Good", color: "#3b82f6" };
    if (averagePercentage >= 60) return { text: "Needs Improvement", color: "#f59e0b" };
    if (averagePercentage >= 40) return { text: "Poor", color: "#ef4444" };
    return { text: "Supervision Needed", color: "#dc2626" };
  };

  const performance = getPerformanceBadge();

  return (
    <div ref={ref} className="printable-profile" style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ borderBottom: "3px solid #1e40af", paddingBottom: "20px", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e3a8a", margin: 0 }}>Edumaster School</h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>Excellence in Education</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Generated on: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>Student Profile Report</h2>
      </div>

      {/* Student Photo and Basic Info */}
      <div style={{ display: "flex", gap: "30px", marginBottom: "30px", alignItems: "flex-start" }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: "150px",
            height: "150px",
            borderRadius: "12px",
            overflow: "hidden",
            border: "3px solid #e2e8f0",
            backgroundColor: "#f1f5f9"
          }}>
            <PhotoAvatar
              src={student.photo}
              alt={student.name}
              name={student.name}
              size="150px"
              type="student"
            />
          </div>
        </div>

        {/* Basic Details */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f172a", margin: "0 0 20px 0" }}>
            {student.name}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Admission ID:</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.admissionId || `ADM${student.id}`}</span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Class:</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.class || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Roll Number:</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.rollNo || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Gender:</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.gender || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Date of Birth:</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: "600" }}>
                {student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd MMM yyyy") : "N/A"}
              </span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Blood Group:</span>{" "}
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.bloodGroup || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Status:</span>{" "}
              <span style={{
                color: student.status === "active" ? "#10b981" : "#f59e0b",
                fontWeight: "600",
                textTransform: "capitalize"
              }}>
                {student.status || "Active"}
              </span>
            </div>
            <div>
              <span style={{ color: "#64748b", fontWeight: "500" }}>Fee Status:</span>{" "}
              <span style={{
                color: student.feeStatus === "paid" ? "#10b981" : "#f59e0b",
                fontWeight: "600",
                textTransform: "capitalize"
              }}>
                {student.feeStatus || "Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 15px 0", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
          Contact Information
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
          <div>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Phone:</span>{" "}
            <span style={{ color: "#0f172a" }}>{student.phone || "N/A"}</span>
          </div>
          <div>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Email:</span>{" "}
            <span style={{ color: "#0f172a" }}>{student.email || "N/A"}</span>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Address:</span>{" "}
            <span style={{ color: "#0f172a" }}>
              {student.address ? `${student.address}${student.city ? `, ${student.city}` : ""}${student.state ? `, ${student.state}` : ""}${student.zipCode ? ` - ${student.zipCode}` : ""}` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 15px 0", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
          Parent/Guardian Information
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
          <div>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Parent Name:</span>{" "}
            <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.parentName || "N/A"}</span>
          </div>
          <div>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Relationship:</span>{" "}
            <span style={{ color: "#0f172a" }}>{student.parentRelationship || "N/A"}</span>
          </div>
          <div>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Parent Phone:</span>{" "}
            <span style={{ color: "#0f172a", fontWeight: "600" }}>{student.parentPhone || "N/A"}</span>
          </div>
          <div>
            <span style={{ color: "#64748b", fontWeight: "500" }}>Parent Email:</span>{" "}
            <span style={{ color: "#0f172a" }}>{student.parentEmail || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Academic Performance */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 15px 0", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
          Academic Performance
        </h4>
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ color: "#64748b", fontWeight: "500", fontSize: "14px" }}>Average Academic Percentage</span>
            </div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: "#0f172a" }}>
              {averagePercentage > 0 ? `${averagePercentage}%` : "N/A"}
            </div>
          </div>
          <div style={{
            padding: "8px 16px",
            borderRadius: "20px",
            backgroundColor: performance.color + "20",
            border: `2px solid ${performance.color}`,
            color: performance.color,
            fontWeight: "600",
            fontSize: "14px"
          }}>
            {performance.text}
          </div>
        </div>
        {results?.length > 0 && (
          <div style={{ marginTop: "15px", fontSize: "13px", color: "#64748b" }}>
            Based on {results.length} exam(s)
          </div>
        )}
      </div>

      {/* Attendance Summary */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 15px 0", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
          Attendance Summary
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>Average Attendance</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#0f172a" }}>{attendanceStats?.percentage || 0}%</div>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#f0fdf4", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>Present Days</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>{attendanceStats?.present || 0}</div>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#fef2f2", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>Absent Days</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ef4444" }}>{attendanceStats?.absent || 0}</div>
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 15px 0", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
          Fee Summary
        </h4>
        <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#64748b", fontWeight: "500", fontSize: "14px" }}>Total Fee:</span>
            <span style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}>
              ₹{studentFeeStructure?.totalFee?.toLocaleString() || 0}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#64748b", fontWeight: "500", fontSize: "14px" }}>Amount Paid:</span>
            <span style={{ fontSize: "18px", fontWeight: "600", color: "#10b981" }}>
              ₹{studentFeeStructure?.totalPaid?.toLocaleString() || 0}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "2px dashed #e2e8f0" }}>
            <span style={{ color: "#0f172a", fontWeight: "600", fontSize: "15px" }}>
              {(studentFeeStructure?.totalBalance || 0) <= 0 ? "Total Fees Paid" : "Outstanding Amount"}
            </span>
            <span style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: (studentFeeStructure?.totalBalance || 0) <= 0 ? "#10b981" : "#ef4444"
            }}>
              ₹{(studentFeeStructure?.totalBalance || 0) <= 0
                ? (studentFeeStructure?.totalPaid?.toLocaleString() || 0)
                : (studentFeeStructure?.totalBalance?.toLocaleString() || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(student.nationality || student.religion || student.category || student.motherTongue || student.aadhaarNumber || student.emergencyContactName) && (
        <div style={{ marginBottom: "30px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 15px 0", paddingBottom: "8px", borderBottom: "2px solid #e2e8f0" }}>
            Additional Information
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
            {student.nationality && (
              <div>
                <span style={{ color: "#64748b", fontWeight: "500" }}>Nationality:</span>{" "}
                <span style={{ color: "#0f172a" }}>{student.nationality}</span>
              </div>
            )}
            {student.religion && (
              <div>
                <span style={{ color: "#64748b", fontWeight: "500" }}>Religion:</span>{" "}
                <span style={{ color: "#0f172a" }}>{student.religion}</span>
              </div>
            )}
            {student.category && (
              <div>
                <span style={{ color: "#64748b", fontWeight: "500" }}>Category:</span>{" "}
                <span style={{ color: "#0f172a" }}>{student.category}</span>
              </div>
            )}
            {student.motherTongue && (
              <div>
                <span style={{ color: "#64748b", fontWeight: "500" }}>Mother Tongue:</span>{" "}
                <span style={{ color: "#0f172a" }}>{student.motherTongue}</span>
              </div>
            )}
            {student.aadhaarNumber && (
              <div>
                <span style={{ color: "#64748b", fontWeight: "500" }}>Aadhaar Number:</span>{" "}
                <span style={{ color: "#0f172a" }}>{student.aadhaarNumber}</span>
              </div>
            )}
            {student.emergencyContactName && (
              <div>
                <span style={{ color: "#64748b", fontWeight: "500" }}>Emergency Contact:</span>{" "}
                <span style={{ color: "#0f172a" }}>{student.emergencyContactName} - {student.emergencyContactPhone || "N/A"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "2px solid #e2e8f0", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
        <p style={{ margin: 0 }}>This is a computer-generated document. Signature not required.</p>
        <p style={{ margin: "4px 0 0 0" }}>© {new Date().getFullYear()} Edumaster School Management System</p>
      </div>
    </div>
  );
});

PrintableStudentProfile.displayName = "PrintableStudentProfile";

export default PrintableStudentProfile;
