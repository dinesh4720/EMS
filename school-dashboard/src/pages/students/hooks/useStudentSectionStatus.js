import { useMemo } from "react";

const TOTALS = {
  identity: 4,
  class: 3,
  contact: 6,
  parents: 2,
  health: 3,
  documents: 3,
};

/**
 * Per-section "filled vs total" progress used by the composer nav and
 * foot. Pure derivation over the form state — no side effects, no
 * setters. Returns the section status array (one entry per SECTIONS id)
 * plus the aggregate `totalFilled`, `totalFields`, and `progressPct`.
 */
export default function useStudentSectionStatus(form, initialData, sections) {
  const sectionStatus = useMemo(() => {
    const fills = {
      identity: [form.fullName, form.dateOfBirth, form.gender, form.aadhaarNumber],
      class: [form.classGrade, form.section, form.rollNumber],
      contact: [form.mobile, form.email, form.address, form.city, form.state, form.zipCode],
      parents: [form.parents?.[0]?.name, form.parents?.[0]?.phone],
      health: [
        form.bloodGroup,
        form.emergencyContactName,
        form.emergencyContactPhone,
        form.healthInfo?.allergies?.some((a) => a.name?.trim()),
        form.healthInfo?.medications?.some((m) => m.name?.trim()),
        form.healthInfo?.emergencyContacts?.some((c) => c.name?.trim() && c.phone?.trim()),
      ],
      documents: [
        form.birthCertificate || initialData?.documents?.some((d) => d.category === "birthCertificate"),
        form.transferCertificate ||
          initialData?.documents?.some((d) => d.category === "transferCertificate"),
        form.aadhaarFront ||
          form.aadhaarBack ||
          initialData?.documents?.some((d) => d.category === "aadhaarCard"),
      ],
    };

    return sections.map((s, i) => {
      const filled = (fills[s.id] || []).filter(Boolean).length;
      const total = TOTALS[s.id] || 0;
      return {
        ...s,
        index: i,
        filled,
        total,
        done: total > 0 && filled >= total,
        countLabel: total ? `${filled} of ${total}` : "",
      };
    });
  }, [form, initialData, sections]);

  const totalFilled = sectionStatus.reduce((acc, s) => acc + s.filled, 0);
  const totalFields = sectionStatus.reduce((acc, s) => acc + s.total, 0);
  const progressPct = totalFields
    ? Math.round((totalFilled / totalFields) * 100)
    : 0;

  return { sectionStatus, totalFilled, totalFields, progressPct };
}
