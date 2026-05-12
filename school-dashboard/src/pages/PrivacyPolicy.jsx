import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import AuthBrand from "../components/auth/AuthBrand";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";

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
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10 md:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <AuthBrand className="!justify-start" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {t("privacyPolicy.title")}
            </p>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {t("privacyPolicy.title")}
            </h1>
            <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">
              {t("privacyPolicy.subtitle")}
            </p>
          </div>
          <Link to="/login" className="self-start">
            <Button variant="outline" size="sm" icon={<ArrowLeft size={14} aria-hidden="true" />}>
              {t("privacyPolicy.backToLogin")}
            </Button>
          </Link>
        </header>

        <Alert
          variant="warning"
          icon={<ShieldAlert size={18} aria-hidden="true" />}
          title="Children's data — DPDPA 2023"
        >
          Schools using this system handle children&apos;s personal data. Legal review is still
          required for DPDPA 2023, consent collection, and retention rules.
        </Alert>

        <div className="grid gap-4">
          {sections.map((section) => (
            <Card key={section.title} as="section" radius="lg" padding="md" elevation="raised">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {section.body}
              </p>
            </Card>
          ))}
        </div>

        <Card as="section" radius="lg" padding="md" elevation="raised">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t("privacyPolicy.dataCategoriesTitle")}
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--color-border)]">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
              <thead className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("privacyPolicy.colCategory")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("privacyPolicy.colExamples")}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t("privacyPolicy.colPurpose")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
                <tr>
                  <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {t("pages.identity")}
                  </td>
                  <td className="px-4 py-3">{t("pages.studentNameAdmissionIdDateOfBirth")}</td>
                  <td className="px-4 py-3">
                    {t("pages.enrollmentRosterManagementProfileMatching")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {t("pages.parentContacts")}
                  </td>
                  <td className="px-4 py-3">{t("pages.parentNamePhoneEmailRelationship")}</td>
                  <td className="px-4 py-3">
                    {t("pages.emergencyContactCommunicationPickupVerification")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {t("pages.attendanceAndAcademics")}
                  </td>
                  <td className="px-4 py-3">
                    {t("pages.attendanceStatusResultsRemarksHomeworkSubmissions")}
                  </td>
                  <td className="px-4 py-3">
                    {t("pages.dailySchoolOperationsAndAcademicReporting")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {t("pages.financialRecords")}
                  </td>
                  <td className="px-4 py-3">{t("pages.feeStructurePaymentsRefunds")}</td>
                  <td className="px-4 py-3">{t("pages.billingReceiptGenerationReconciliation")}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {t("pages.healthAndSafety")}
                  </td>
                  <td className="px-4 py-3">
                    {t("pages.medicalConditionsEmergencyContactsGatePassDetails")}
                  </td>
                  <td className="px-4 py-3">{t("pages.studentSafetyAndEmergencyResponse")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
