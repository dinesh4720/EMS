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
  { name: "Dashboard", path: "/", icon: Home, category: "Navigation" },
  { name: "Students", path: "/students", icon: GraduationCap, category: "Navigation" },
  { name: "Staff List", path: "/staffs", icon: Users, category: "Navigation" },
  { name: "Staff Overview", path: "/staffs/overview", icon: Users, category: "Navigation" },
  { name: "Classes List", path: "/classes", icon: BookOpen, category: "Navigation" },
  { name: "Class Attendance", path: "/classes/attendance", icon: BookOpen, category: "Navigation" },
  { name: "Timetable", path: "/classes/timetable", icon: BookOpen, category: "Navigation" },
  { name: "Academics", path: "/academics", icon: FileText, category: "Navigation" },
  { name: "Exams", path: "/academics/exams", icon: FileText, category: "Navigation" },
  { name: "Calendar", path: "/calendar", icon: Calendar, category: "Navigation" },
  { name: "Collect Fees", path: "/fees/collect", icon: CreditCard, category: "Navigation" },
  { name: "Fee Defaulters", path: "/fees/defaulters", icon: CreditCard, category: "Navigation" },
  { name: "Fee Reports", path: "/fees/reports", icon: CreditCard, category: "Navigation" },
  { name: "Fee Setup", path: "/fees/setup", icon: CreditCard, category: "Navigation" },
  { name: "Announcements", path: "/messaging/announcements", icon: Megaphone, category: "Navigation" },
  { name: "Reminders", path: "/messaging/reminders", icon: MessageSquare, category: "Navigation" },
  { name: "Communication Logs", path: "/messaging/logs", icon: MessageSquare, category: "Navigation" },
  { name: "Institution Settings", path: "/settings/institution", icon: Settings, category: "Navigation" },
  { name: "Roles & Access", path: "/settings/roles", icon: Settings, category: "Navigation" },
  { name: "Fee Rules", path: "/settings/fee-rules", icon: Settings, category: "Navigation" },
  { name: "Attendance Rules", path: "/settings/attendance-rules", icon: Settings, category: "Navigation" },
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
      return { navigation: navigationItems.slice(0, 5), students: [], staff: [], classes: [], exams: [], fees: [], announcements: [] };
    }

    const q = query.toLowerCase();
    const navigation = navigationItems.filter((item) => item.name.toLowerCase().includes(q));

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
        {item.category === "Navigation" && <Kbd className="text-[10px]">\u21B5</Kbd>}
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
    { key: "pages", items: searchResults.navigation || [] },
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
              <span className="flex items-center gap-1"><Kbd>\u2191</Kbd><Kbd>\u2193</Kbd> {t("globalSearch.navigate")}</span>
              <span className="flex items-center gap-1"><Kbd>\u21B5</Kbd> {t("globalSearch.select")}</span>
              <span className="flex items-center gap-1"><Kbd>Esc</Kbd> {t("globalSearch.close")}</span>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
