import { getDateLocale } from "../../i18n/index";

export const getNumberFormatter = () => new Intl.NumberFormat(getDateLocale());

export const getCurrencyFormatter = () =>
  new Intl.NumberFormat(getDateLocale(), {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

export const getMonthFormatter = () =>
  new Intl.DateTimeFormat(getDateLocale(), { month: "short" });

export const createEmptyAttendanceSnapshot = (totalClasses = 0) => ({
  studentRate: null,
  studentPresent: 0,
  studentTotal: 0,
  markedClasses: 0,
  totalClasses,
  staffRate: null,
  staffPresent: 0,
  staffMarked: 0,
  staffTotal: 0,
});

export function toValidDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getRecordDate(record) {
  return (
    record?.paymentDate ||
    record?.date ||
    record?.createdAt ||
    record?.updatedAt ||
    record?.sentAt ||
    record?.scheduledFor ||
    null
  );
}

export function isSameDay(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function isSameMonth(date, reference) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function normalizePayments(response, students) {
  const studentsById = new Map(
    (students || []).map((student) => [String(student.id), student])
  );
  const records = Array.isArray(response)
    ? response
    : Array.isArray(response?.payments)
      ? response.payments
      : [];

  return records
    .map((payment) => {
      const studentId = String(
        payment?.studentId?._id || payment?.studentId || ""
      );
      const studentRecord = studentsById.get(studentId);
      const recordDate = toValidDate(getRecordDate(payment));
      const amount = Number(payment?.amount || payment?.paidAmount || 0);
      const status = String(payment?.status || "paid").toLowerCase();

      return {
        id:
          payment?._id ||
          payment?.id ||
          `${studentId}-${recordDate?.toISOString() || "payment"}`,
        student:
          payment?.studentName ||
          payment?.studentId?.name ||
          studentRecord?.name ||
          "Unknown student",
        className:
          payment?.className ||
          payment?.studentId?.className ||
          studentRecord?.class ||
          studentRecord?.className ||
          "—",
        amount: Number.isFinite(amount) ? amount : 0,
        status,
        date: recordDate?.toISOString() || null,
      };
    })
    .filter((payment) => payment.date)
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

export function isSuccessfulPayment(payment) {
  return !["failed", "cancelled", "refunded"].includes(
    String(payment?.status || "").toLowerCase()
  );
}

export function normalizeAnnouncements(response) {
  const records = Array.isArray(response)
    ? response
    : Array.isArray(response?.announcements)
      ? response.announcements
      : [];

  return records
    .map((announcement) => {
      const recordDate = toValidDate(getRecordDate(announcement));
      return {
        id:
          announcement?._id ||
          announcement?.id ||
          announcement?.title ||
          "announcement",
        title: announcement?.title || "Announcement",
        content: announcement?.content || announcement?.message || "",
        status: announcement?.status || "draft",
        date: recordDate?.toISOString() || null,
      };
    })
    .filter((announcement) => announcement.date)
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

export function createFeeCollectionSeries(payments) {
  const formatter = getMonthFormatter();
  const now = new Date();
  const months = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      month: formatter.format(monthDate),
      collected: 0,
    });
  }

  const monthIndex = new Map(months.map((month) => [month.key, month]));

  payments.forEach((payment) => {
    const paymentDate = toValidDate(payment.date);
    if (!paymentDate) return;
    const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
    const month = monthIndex.get(key);
    if (month) {
      month.collected += payment.amount;
    }
  });

  return months;
}

export function getRelativeTime(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  const now = new Date();
  const diff = now - parsed;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return parsed.toLocaleDateString(getDateLocale(), {
    month: "short",
    day: "numeric",
  });
}
