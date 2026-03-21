import { Link } from "react-router-dom";

const sections = [
  {
    title: "What data SchoolSync processes",
    body: "SchoolSync can process student identity details, dates of birth, parent and guardian contact details, attendance records, academic records, fee and refund records, visitor and gate-pass details, and health or medical notes added to student profiles.",
  },
  {
    title: "Why the data is processed",
    body: "The platform uses this data to run school operations such as admissions, class rosters, parent communication, attendance tracking, fee collection, safety workflows, and academic reporting.",
  },
  {
    title: "Children's data",
    body: "Because the platform is designed for schools, much of the data belongs to children. Schools using this system should complete a legal review for DPDPA 2023 and any other local child-data obligations before production use.",
  },
  {
    title: "Deletion and retention",
    body: "Student deletion now performs permanent erasure of the student record and linked personal data instead of moving the student to a recoverable trash state. Schools should define a reviewed retention schedule for records that must be kept longer for statutory reasons.",
  },
  {
    title: "Current compliance status",
    body: "This policy page is a baseline implementation, not a final legal sign-off. Consent tracking, reviewed retention schedules, and legal wording still require school-specific counsel and operational approval.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">SchoolSync</p>
            <h1 className="mt-2 text-3xl font-bold">Privacy Policy</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-zinc-400">
              Baseline privacy notice for SchoolSync deployments. This document should be reviewed and approved by the school&apos;s legal or compliance owner before production rollout.
            </p>
          </div>
          <Link
            to="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-teal-600 dark:hover:text-teal-400"
          >
            Back to login
          </Link>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Schools using this system handle children&apos;s personal data. Legal review is still required for DPDPA 2023, consent collection, and retention rules.
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Data categories and purposes</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-zinc-800">
              <thead className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Examples</th>
                  <th className="px-4 py-3 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-600 dark:divide-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">Identity</td>
                  <td className="px-4 py-3">Student name, admission ID, date of birth</td>
                  <td className="px-4 py-3">Enrollment, roster management, profile matching</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">Parent contacts</td>
                  <td className="px-4 py-3">Parent name, phone, email, relationship</td>
                  <td className="px-4 py-3">Emergency contact, communication, pickup verification</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">Attendance and academics</td>
                  <td className="px-4 py-3">Attendance status, results, remarks, homework submissions</td>
                  <td className="px-4 py-3">Daily school operations and academic reporting</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">Financial records</td>
                  <td className="px-4 py-3">Fee structure, payments, refunds</td>
                  <td className="px-4 py-3">Billing, receipt generation, reconciliation</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">Health and safety</td>
                  <td className="px-4 py-3">Medical conditions, emergency contacts, gate pass details</td>
                  <td className="px-4 py-3">Student safety and emergency response</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
