import { escapeHtml } from "../../../utils/sanitize";
import { formatShortDate } from "../../../utils/dateFormatter";
import toast from "react-hot-toast";

/**
 * Sanitize a CSV cell value to prevent formula injection.
 * Values starting with =, +, -, @, \t, or \r are prefixed with a
 * single-quote so spreadsheet apps treat them as plain text.
 */
export const sanitizeCsvCell = (value) => {
    const str = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(str)) {
        return "'" + str;
    }
    return str;
};

/**
 * Export the filtered staff list as a CSV file download.
 * @param {Array}    filteredItems            - Already-filtered staff array
 * @param {Function} getAttendancePercentage  - (staffId) => number
 * @param {string}   successMessage           - i18n toast message
 */
export const exportToCSV = (filteredItems, getAttendancePercentage, successMessage) => {
    const headers = ["Staff Name", "Employee ID", "Role", "Contact", "Email", "Status", "Attendance %"];
    const rows = filteredItems.map((s) => [
        s.name,
        s.code,
        Array.isArray(s.role) ? s.role.join(", ") : s.role,
        s.phone || "N/A",
        s.email,
        s.status,
        `${getAttendancePercentage(s.id)}%`,
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${sanitizeCsvCell(cell)}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-list-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(successMessage);
};

/**
 * Export the filtered staff list as a printable PDF (new browser window).
 * @param {Array}    filteredItems            - Already-filtered staff array
 * @param {string}   successMessage           - i18n toast message
 */
export const exportToPDF = (filteredItems, successMessage) => {
    const rows = filteredItems
        .map(
            (s) => `
          <tr>
            <td>${escapeHtml(s.name || "")}</td>
            <td>${escapeHtml(s.code || "")}</td>
            <td>${escapeHtml(Array.isArray(s.role) ? s.role.join(", ") : s.role || "")}</td>
            <td>${escapeHtml(s.department || "")}</td>
            <td>${escapeHtml(s.phone || "N/A")}</td>
            <td>${escapeHtml(s.email || "")}</td>
            <td>${escapeHtml(s.status || "")}</td>
          </tr>`
        )
        .join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Staff List</title>
<style>
body{font-family:'Segoe UI',Arial,sans-serif;margin:40px;color:#111}
h1{font-size:20px;font-weight:700;margin-bottom:4px}
p{font-size:12px;color:#888;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f3f4f6;text-align:left;padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151}
td{padding:8px 12px;border:1px solid #e5e7eb}
tr:nth-child(even) td{background:#f9fafb}
@media print{body{margin:20px}}
</style></head>
<body>
<h1>Staff List</h1>
<p>Generated on ${formatShortDate(new Date())} — ${filteredItems.length} staff member(s)</p>
<table>
<thead><tr><th>Name</th><th>Code</th><th>Role</th><th>Department</th><th>Phone</th><th>Email</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

    const w = window.open("", "_blank", "width=1000,height=700");
    if (!w) {
        toast.error("Pop-up blocked. Allow pop-ups to export PDF.");
        return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
    toast.success(successMessage);
};
