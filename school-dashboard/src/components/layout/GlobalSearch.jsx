import { useState, useEffect, useMemo, useCallback, useDeferredValue } from "react";
import { Modal, ModalContent, ModalBody, Kbd } from "@heroui/react";
import {
  Search, User, Users, GraduationCap, BookOpen, CreditCard,
  MessageSquare, Settings, Home, X, Calendar, FileText, Megaphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../../services/api";
import { useTranslation } from "react-i18next";

const navigationItems = [
  // ── Core ──
  { name: "Dashboard", path: "/", icon: Home, category: "Navigation", keywords: "home overview stats" },
  { name: "Schedule", path: "/calendar", icon: Calendar, category: "Navigation", keywords: "calendar events holidays timetable" },
  { name: "Analytics", path: "/analytics", icon: Home, category: "Navigation", keywords: "reports charts data insights" },

  // ── Management ──
  { name: "Students", path: "/students", icon: GraduationCap, category: "Navigation", keywords: "pupil learner admission enroll" },
  { name: "Student Promotion", path: "/students/promotion", icon: GraduationCap, category: "Navigation", keywords: "promote next class upgrade" },
  { name: "Transfer Certificate", path: "/students/transfer-certificate", icon: GraduationCap, category: "Navigation", keywords: "TC leaving certificate" },
  { name: "Staff", path: "/staffs", icon: Users, category: "Navigation", keywords: "teachers employees faculty" },
  { name: "Classes", path: "/classes", icon: BookOpen, category: "Navigation", keywords: "sections rooms class teacher" },

  // ── Academics ──
  { name: "Academics", path: "/academics", icon: FileText, category: "Navigation", keywords: "exams results marks grades" },
  { name: "Homework", path: "/classes", icon: FileText, category: "Navigation", keywords: "assignments tasks classwork homework tab" },
  { name: "PTM", path: "/ptm", icon: Users, category: "Navigation", keywords: "parent teacher meeting conference" },

  // ── Communication ──
  { name: "Messages", path: "/messaging", icon: MessageSquare, category: "Navigation", keywords: "chat announcements notices" },
  { name: "Announcements", path: "/messaging/announcements", icon: Megaphone, category: "Navigation", keywords: "notice circular broadcast" },

  // ── Finance ──
  { name: "Fee Collection", path: "/fees", icon: CreditCard, category: "Navigation", keywords: "payments collect money dues" },
  { name: "Fee Defaulters", path: "/fees/defaulters", icon: CreditCard, category: "Navigation", keywords: "overdue pending unpaid" },
  { name: "Fee Reports", path: "/fees/reports", icon: CreditCard, category: "Navigation", keywords: "collection summary revenue" },

  // ── Operations ──
  { name: "Front Desk", path: "/front-desk", icon: Users, category: "Navigation", keywords: "visitors gate pass reception" },
  { name: "Library", path: "/library", icon: BookOpen, category: "Navigation", keywords: "books issue return catalogue" },
  { name: "Reports", path: "/reports", icon: FileText, category: "Navigation", keywords: "analytics data export download" },

  // ── Intake Forms ──
  { name: "Intake Form Assignments", path: "/intake-forms/assignments", icon: FileText, category: "Navigation", keywords: "admission forms assign send" },
  { name: "Intake Form Submissions", path: "/intake-forms/submissions", icon: FileText, category: "Navigation", keywords: "admission responses received" },
  { name: "Intake Form Funnel", path: "/intake-forms/funnel", icon: FileText, category: "Navigation", keywords: "admission pipeline conversion" },

  // ── Data Tools ──
  { name: "Data Tools", path: "/data-tools", icon: Settings, category: "Navigation", keywords: "import export migrate bulk" },

  // ── Settings: General ──
  { name: "General Settings", path: "/settings", icon: Settings, category: "Settings", keywords: "institution school name logo address" },
  { name: "Academic Settings", path: "/settings/academics", icon: Settings, category: "Settings", keywords: "academic year subjects grading" },
  { name: "Admission Form Settings", path: "/settings/admission-form", icon: Settings, category: "Settings", keywords: "admission fields customize form" },
  { name: "Intake Forms Settings", path: "/settings/intake-forms", icon: Settings, category: "Settings", keywords: "admission form builder" },

  // ── Settings: Users & Access ──
  { name: "User Management", path: "/settings/users", icon: Settings, category: "Settings", keywords: "admin accounts login users" },
  { name: "Staff ID Configuration", path: "/settings/staff-id", icon: Settings, category: "Settings", keywords: "employee id card badge" },
  { name: "Roles & Permissions", path: "/settings/roles", icon: Settings, category: "Settings", keywords: "access control role based admin teacher" },
  { name: "Permission Requests", path: "/settings/permission-requests", icon: Settings, category: "Settings", keywords: "access request approval" },
  { name: "Parent Accounts", path: "/settings/parents", icon: Settings, category: "Settings", keywords: "parent login app access" },

  // ── Settings: Scheduling ──
  { name: "Attendance Rules", path: "/settings/attendance-rules", icon: Settings, category: "Settings", keywords: "half day late policy absent present" },
  { name: "Holiday Calendar", path: "/settings/holidays", icon: Settings, category: "Settings", keywords: "holidays vacation off days" },
  { name: "Leave Types", path: "/settings/leaves", icon: Settings, category: "Settings", keywords: "sick casual earned leave" },
  { name: "Period Timings", path: "/settings/periods", icon: Settings, category: "Settings", keywords: "class periods bell schedule timing" },
  { name: "Timetable Cleanup", path: "/settings/timetable-cleanup", icon: Settings, category: "Settings", keywords: "fix orphan timetable" },
  { name: "Promotion Rules", path: "/settings/promotion-rules", icon: Settings, category: "Settings", keywords: "pass fail criteria grade promotion" },

  // ── Settings: Finance ──
  { name: "Fee Management", path: "/settings/fees", icon: Settings, category: "Settings", keywords: "fee heads concessions late fees structure" },
  { name: "Payroll Settings", path: "/settings/payroll", icon: Settings, category: "Settings", keywords: "salary deductions allowances payslip" },

  // ── Settings: Communication ──
  { name: "Communication Settings", path: "/settings/communication", icon: Settings, category: "Settings", keywords: "sms email whatsapp notification templates" },

  // ── Settings: Integrations ──
  { name: "Webhooks", path: "/settings/webhooks", icon: Settings, category: "Settings", keywords: "api integrations endpoints webhook" },
  { name: "SCIM Provisioning", path: "/settings/scim", icon: Settings, category: "Settings", keywords: "sso provisioning directory sync" },

  // ── Settings: System ──
  { name: "NPS Analytics", path: "/settings/nps", icon: Settings, category: "Settings", keywords: "feedback survey satisfaction score" },
  { name: "Subscription", path: "/settings/subscription", icon: Settings, category: "Settings", keywords: "plan billing pricing upgrade" },
  { name: "Trash", path: "/settings/trash", icon: Settings, category: "Settings", keywords: "deleted restore recover recycle bin" },
  { name: "Seed Data", path: "/settings/seed-data", icon: Settings, category: "Settings", keywords: "demo sample data generate" },
  { name: "Data Cleanup", path: "/settings/data-cleanup", icon: Settings, category: "Settings", keywords: "clean purge remove old data" },
  { name: "Active Sessions", path: "/settings/sessions", icon: Settings, category: "Settings", keywords: "login sessions devices security" },
];

const CATEGORY_ICONS = {
  Staff: User,
  Students: GraduationCap,
  Classes: BookOpen,
  Exams: FileText,
  Fees: CreditCard,
  Announcements: Megaphone,
};

export default function GlobalSearch({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiResults, setApiResults] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const deferredQuery = useDeferredValue(query.trim());

  // ── Unified search API call ──────────────────────────────────────────
  useEffect(() => {
    if (!deferredQuery) {
      setApiResults({});
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const response = await searchApi.search(
          { q: deferredQuery, types: "students,staff,classes,fees,exams,announcements", limit: "5" },
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setApiResults(response);
          setLoading(false);
        }
      } catch (error) {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          setApiResults({});
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [deferredQuery]);

  // ── Combine navigation (client-side) + API results ───────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return { navigation: [], students: [], staff: [], classes: [], exams: [], fees: [], announcements: [] };
    }

    const q = query.toLowerCase();
    const navigation = navigationItems.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );

    const students = (apiResults?.students?.results || []).map((s) => ({
      id: String(s._id || s.id || ""),
      name: s.name || "Student",
      admissionId: s.admissionId || "",
      className: s.classId?.name || s.class || "",
      section: s.classId?.section || "",
      category: "Students",
    }));

    const staff = (apiResults?.staff?.results || []).map((s) => ({
      id: String(s._id || s.id || ""),
      name: s.name || "Staff",
      department: s.department || "",
      role: s.role || "",
      category: "Staff",
    }));

    const classes = (apiResults?.classes?.results || []).map((c) => ({
      id: String(c._id || c.id || ""),
      name: c.name || "",
      section: c.section || "",
      category: "Classes",
    }));

    const exams = (apiResults?.exams?.results || []).map((e) => ({
      id: String(e._id || e.id || ""),
      name: e.name || "Exam",
      className: e.classId?.name || "",
      classSection: e.classId?.section || "",
      type: e.type || "",
      status: e.status || "",
      category: "Exams",
    }));

    const fees = (apiResults?.fees?.results || []).map((f) => ({
      id: String(f._id || f.id || ""),
      name: f.studentId?.name || f.receiptNumber || "Payment",
      receiptNumber: f.receiptNumber || "",
      amount: f.amount || 0,
      status: f.status || "",
      category: "Fees",
    }));

    const announcements = (apiResults?.announcements?.results || []).map((a) => ({
      id: String(a._id || a.id || ""),
      name: a.title || "Announcement",
      status: a.status || "",
      createdAt: a.createdAt || "",
      category: "Announcements",
    }));

    return { navigation, students, staff, classes, exams, fees, announcements };
  }, [query, apiResults]);

  // ── Flat list for keyboard navigation ────────────────────────────────
  const allResults = useMemo(() => [
    ...(searchResults.navigation || []),
    ...(searchResults.students || []),
    ...(searchResults.staff || []),
    ...(searchResults.classes || []),
    ...(searchResults.exams || []),
    ...(searchResults.fees || []),
    ...(searchResults.announcements || []),
  ], [searchResults]);

  // ── Navigation on select ─────────────────────────────────────────────
  const handleSelect = useCallback((item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.category === "Students") {
      navigate(`/students/${item.id}`);
    } else if (item.category === "Staff") {
      navigate(`/staffs/${item.id}`);
    } else if (item.category === "Classes") {
      navigate(`/classes/${item.id}`);
    } else if (item.category === "Exams") {
      navigate("/academics/exams");
    } else if (item.category === "Fees") {
      navigate("/fees/collect");
    } else if (item.category === "Announcements") {
      navigate("/messaging/announcements");
    }
    onClose();
    setQuery("");
  }, [navigate, onClose]);

  // ── Reset index on query change ──────────────────────────────────────
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // ── Keyboard navigation ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (allResults.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(allResults[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allResults, selectedIndex, handleSelect]);

  // ── Render helpers ───────────────────────────────────────────────────
  const renderItem = (item, _index, globalIndex) => {
    const isSelected = globalIndex === selectedIndex;
    const Icon = item.icon || CATEGORY_ICONS[item.category] || Search;

    return (
      <button
        key={item.id || item.path || globalIndex}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-default-100"
        }`}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
      >
        <div className={`p-1.5 rounded-md ${isSelected ? "bg-primary/20" : "bg-default-100"}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          {item.category === "Staff" && (
            <p className="text-xs text-default-400 truncate">
              {[item.department, item.role].filter(Boolean).join(" \u2022 ")}
            </p>
          )}
          {item.category === "Students" && (
            <p className="text-xs text-default-400 truncate">
              {[item.className && `Class ${item.className}${item.section ? ` ${item.section}` : ""}`, item.admissionId].filter(Boolean).join(" \u2022 ")}
            </p>
          )}
          {item.category === "Classes" && (
            <p className="text-xs text-default-400 truncate">
              Class {item.name} {item.section}
            </p>
          )}
          {item.category === "Exams" && (
            <p className="text-xs text-default-400 truncate">
              {[item.className && `${item.className}${item.classSection ? ` ${item.classSection}` : ""}`, item.type, item.status].filter(Boolean).join(" \u2022 ")}
            </p>
          )}
          {item.category === "Fees" && (
            <p className="text-xs text-default-400 truncate">
              {[item.receiptNumber, item.amount && `\u20B9${item.amount}`].filter(Boolean).join(" \u2022 ")}
            </p>
          )}
          {item.category === "Announcements" && (
            <p className="text-xs text-default-400 truncate">
              {[item.status, item.createdAt && new Date(item.createdAt).toLocaleDateString('en-IN')].filter(Boolean).join(" \u2022 ")}
            </p>
          )}
        </div>
        {item.category === "Navigation" && <Kbd className="text-[10px]">↵</Kbd>}
      </button>
    );
  };

  const renderSection = (title, items, startIndex) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-medium text-default-400 px-3 mb-1.5">{title}</p>
        {items.map((item, i) => renderItem(item, i, startIndex + i))}
      </div>
    );
  };

  // ── Compute section offsets for keyboard index ───────────────────────
  const sections = [
    { key: "navigation", items: searchResults.navigation || [] },
    { key: "students", items: searchResults.students || [] },
    { key: "staff", items: searchResults.staff || [] },
    { key: "classes", items: searchResults.classes || [] },
    { key: "exams", items: searchResults.exams || [] },
    { key: "fees", items: searchResults.fees || [] },
    { key: "announcements", items: searchResults.announcements || [] },
  ];

  let runningOffset = 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setQuery(""); }}
      size="lg"
      placement="top"
      classNames={{ base: "mt-20", backdrop: "bg-black/50 backdrop-blur-sm" }}
      hideCloseButton
    >
      <ModalContent>
        <ModalBody className="p-0">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-default-200">
            <Search size={18} className="text-default-400" />
            <input
              autoFocus
              type="search"
              name="global-search-query"
              autoComplete="off"
              data-form-type="other"
              placeholder={t("globalSearch.placeholder")}
              className="flex-1 bg-transparent outline-none text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={() => { onClose(); setQuery(""); }} className="p-1 hover:bg-default-100 rounded">
              <X size={16} className="text-default-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading && allResults.length === 0 ? (
              <div className="py-8 text-center text-default-400">
                <Search size={32} className="mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">{t("globalSearch.searching", "Searching...")}</p>
              </div>
            ) : query.trim() && allResults.length === 0 && !loading ? (
              <div className="py-8 text-center text-default-400">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("globalSearch.noResults", { query })}</p>
              </div>
            ) : (
              <>
                {sections.map((sec) => {
                  const offset = runningOffset;
                  runningOffset += sec.items.length;
                  return (
                    <div key={sec.key}>
                      {renderSection(
                        t(`globalSearch.categories.${sec.key}`, sec.key),
                        sec.items,
                        offset
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-default-200 text-xs text-default-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> {t("globalSearch.navigate")}</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> {t("globalSearch.select")}</span>
              <span className="flex items-center gap-1"><Kbd>Esc</Kbd> {t("globalSearch.close")}</span>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
