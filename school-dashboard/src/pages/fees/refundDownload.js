function sanitize(value) {
  const str = String(value ?? "");
  return (/^[=+\-@\t\r]/.test(str) ? "'" : "") + str.replace(/"/g, '""');
}

export function downloadRefundCsv(refund) {
  const rows = [
    ["Refund ID", refund._id],
    ["Student", refund.studentId?.name || ""],
    [
      "Class",
      `${refund.classId?.name || ""} ${refund.classId?.section || ""}`.trim(),
    ],
    ["Amount", refund.amount ?? 0],
    ["Reason", refund.reason || ""],
    ["Refund Mode", refund.refundMode || ""],
    ["Status", refund.status || ""],
    ["Refund Date", refund.refundDate || ""],
    ["Remarks", refund.remarks || ""],
    ["Created At", refund.createdAt || ""],
  ];
  const csvContent = [
    "Field,Value",
    ...rows.map((r) => r.map((c) => `"${sanitize(c)}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `refund-${refund._id}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
