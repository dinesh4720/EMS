import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  IndianRupee,
  Megaphone,
  UserPlus,
  GraduationCap,
  CalendarPlus,
  Search,
  LayoutDashboard,
  Users,
  Briefcase,
  School,
  BookOpen,
  Wallet,
  MessageSquare,
  Calendar,
  DoorOpen,
  BarChart3,
  Settings as SettingsIcon,
  CornerDownLeft,
  ArrowUpDown,
  History,
  FileText,
  Library,
  Package,
  Home,
  Bus,
  Bell,
} from "lucide-react";
import { useStudents } from "../../context/StudentsContext";
import { useStaff } from "../../context/StaffContext";
import { useClasses } from "../../context/ClassesContext";
import {
  feesApi,
  examsApi,
  libraryApi,
  inventoryApi,
  hostelApi,
  transportApi,
  announcementsApi,
} from "../../services/api";

// Static destinations — grouped by Pages / Settings / Actions per task spec.
const PAGES = [
  { id: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard },
  { id: "students", label: "Students", to: "/students", icon: Users },
  { id: "staffs", label: "Staff", to: "/staffs", icon: Briefcase },
  { id: "classes", label: "Classes", to: "/classes", icon: School },
  { id: "academics", label: "Academics", to: "/academics", icon: BookOpen },
  { id: "fees", label: "Fees", to: "/fees", icon: Wallet },
  { id: "messaging", label: "Messaging", to: "/messaging", icon: MessageSquare },
  { id: "calendar", label: "Calendar", to: "/calendar", icon: Calendar },
  { id: "front-desk", label: "Front Desk", to: "/front-desk", icon: DoorOpen },
  { id: "reports", label: "Reports", to: "/reports", icon: BarChart3 },
  { id: "library", label: "Library", to: "/library", icon: Library },
  { id: "inventory", label: "Inventory", to: "/inventory", icon: Package },
  { id: "hostel", label: "Hostel", to: "/hostel", icon: Home },
  { id: "transport", label: "Transport", to: "/transport", icon: Bus },
];

const SETTINGS = [
  { id: "settings", label: "Settings overview", to: "/settings" },
  { id: "settings-school", label: "School profile", to: "/settings/school" },
  { id: "settings-academic", label: "Academic year", to: "/settings/academic" },
  { id: "settings-users", label: "Users & roles", to: "/settings/users" },
  { id: "settings-billing", label: "Billing & plan", to: "/settings/billing" },
  { id: "settings-notifications", label: "Notifications", to: "/settings/notifications" },
];

const ACTIONS = [
  { id: "mark-attendance", label: "Mark today's attendance", icon: CheckCircle2, to: "/classes" },
  { id: "collect-fee", label: "Collect fee", icon: IndianRupee, to: "/fees" },
  { id: "send-announcement", label: "Send announcement", icon: Megaphone, to: "/messaging" },
  { id: "add-staff", label: "Add staff", icon: UserPlus, to: "/staffs" },
  { id: "add-student", label: "Add student", icon: GraduationCap, to: "/students" },
  { id: "create-event", label: "Create event", icon: CalendarPlus, to: "/calendar" },
];

const RECENTS_KEY = "ems:cmdk:recents";
const RECENTS_MAX = 5;

function readRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, RECENTS_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(entry) {
  if (!entry?.to) return;
  try {
    const list = readRecents().filter((r) => r.to !== entry.to);
    list.unshift({ id: entry.id, label: entry.label, to: entry.to });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, RECENTS_MAX)));
  } catch {
    /* ignore quota errors */
  }
}

function GroupHeading({ label, count }) {
  return (
    <>
      <span>{label}</span>
      {typeof count === "number" && count > 0 ? (
        <span className="cmdk__group-count">{count}</span>
      ) : null}
    </>
  );
}

function PaletteItem({ children, onSelect }) {
  return (
    <Command.Item onSelect={onSelect} className="cmdk__item">
      <button type="button">{children}</button>
    </Command.Item>
  );
}

/* Hook: fetch extended search data on open */
function useExtendedSearch(isOpen) {
  const [feeRecords, setFeeRecords] = useState([]);
  const [exams, setExams] = useState([]);
  const [books, setBooks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      feesApi.getPayments({ limit: 50 }),
      examsApi.getAll({ limit: 50 }),
      libraryApi.getBooks({ limit: 50 }),
      inventoryApi.getAssets({ limit: 50 }),
      hostelApi.getRooms({ limit: 50 }),
      transportApi.getRoutes({ limit: 50 }),
      announcementsApi.getAll({ limit: 50 }),
    ]).then(([feesR, examsR, booksR, assetsR, roomsR, routesR, announcementsR]) => {
      if (cancelled) return;

      const feePayments =
        feesR.status === "fulfilled"
          ? (feesR.value?.payments || feesR.value || []).slice(0, 50)
          : [];
      setFeeRecords(
        feePayments.map((p) => ({
          id: p._id || p.id,
          label: p.studentName || p.studentId?.name || "Fee payment",
          sub: p.amount ? `₹${p.amount}` : "",
          to: `/fees`,
        }))
      );

      const examList =
        examsR.status === "fulfilled"
          ? (examsR.value?.exams || examsR.value || []).slice(0, 50)
          : [];
      setExams(
        examList.map((e) => ({
          id: e._id || e.id,
          label: e.name || e.title || "Exam",
          sub: e.examType || e.subject || "",
          to: `/academics/exams/${e._id || e.id}`,
        }))
      );

      const bookList =
        booksR.status === "fulfilled"
          ? (booksR.value?.books || booksR.value || []).slice(0, 50)
          : [];
      setBooks(
        bookList.map((b) => ({
          id: b._id || b.id,
          label: b.title || b.name || "Book",
          sub: b.author || b.isbn || "",
          to: `/library/books/${b._id || b.id}`,
        }))
      );

      const assetList =
        assetsR.status === "fulfilled"
          ? (assetsR.value?.assets || assetsR.value || []).slice(0, 50)
          : [];
      setAssets(
        assetList.map((a) => ({
          id: a._id || a.id,
          label: a.name || a.assetName || "Asset",
          sub: a.category || a.status || "",
          to: `/inventory/assets/${a._id || a.id}`,
        }))
      );

      const roomList =
        roomsR.status === "fulfilled"
          ? (roomsR.value?.rooms || roomsR.value || []).slice(0, 50)
          : [];
      setRooms(
        roomList.map((r) => ({
          id: r._id || r.id,
          label: r.roomNumber || r.name || "Room",
          sub: r.hostelName || r.type || "",
          to: `/hostel/rooms/${r._id || r.id}`,
        }))
      );

      const routeList =
        routesR.status === "fulfilled"
          ? (routesR.value?.routes || routesR.value || []).slice(0, 50)
          : [];
      setRoutes(
        routeList.map((r) => ({
          id: r._id || r.id,
          label: r.name || r.routeName || "Route",
          sub: r.vehicleNumber || r.startPoint || "",
          to: `/transport/routes/${r._id || r.id}`,
        }))
      );

      const announcementList =
        announcementsR.status === "fulfilled"
          ? (announcementsR.value?.announcements || announcementsR.value || []).slice(0, 50)
          : [];
      setAnnouncements(
        announcementList.map((a) => ({
          id: a._id || a.id,
          label: a.title || "Announcement",
          sub: a.status || "",
          to: `/messaging`,
        }))
      );

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return { feeRecords, exams, books, assets, rooms, routes, announcements, loading };
}

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const previouslyFocused = useRef(null);
  const inputRef = useRef(null);

  // Domain data — used to populate Students/Staff/Classes groups.
  const studentsCtx = useStudents();
  const staffCtx = useStaff();
  const classesCtx = useClasses();
  const allStudents = studentsCtx?.students || [];
  const allStaff = staffCtx?.staff || [];
  const allClasses = classesCtx?.classes || [];

  const studentItems = useMemo(
    () =>
      allStudents.slice(0, 200).map((s) => ({
        id: s._id || s.id,
        label: s.name || s.fullName || s.admissionNo || "Student",
        sub: s.admissionNo || s.className || "",
        to: `/students/${s._id || s.id}`,
      })),
    [allStudents]
  );
  const staffItems = useMemo(
    () =>
      allStaff.slice(0, 200).map((s) => ({
        id: s._id || s.id,
        label: s.name || s.fullName || s.email || "Staff",
        sub: s.role || s.designation || "",
        to: `/staffs/${s._id || s.id}`,
      })),
    [allStaff]
  );
  const classItems = useMemo(
    () =>
      allClasses.slice(0, 200).map((c) => ({
        id: c._id || c.id,
        label: c.name || `${c.grade || ""} ${c.section || ""}`.trim() || "Class",
        sub: c.section ? `Section ${c.section}` : "",
        to: `/classes/${c._id || c.id}`,
      })),
    [allClasses]
  );

  const recents = useMemo(() => (isOpen ? readRecents() : []), [isOpen]);

  // Extended search data
  const { feeRecords, exams, books, assets, rooms, routes, announcements } = useExtendedSearch(isOpen);

  // Cache focused element + restore on close.
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const id = window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
    const target = previouslyFocused.current;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
    return undefined;
  }, [isOpen]);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const run = (entry) => {
    pushRecent(entry);
    onClose?.();
    navigate(entry.to);
  };

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="cmdk-overlay"
      onClick={onClose}
    >
      <div className="cmdk glass" onClick={(e) => e.stopPropagation()}>
        <Command label="Command palette" loop shouldFilter>
          <div className="cmdk__head">
            <Search size={14} style={{ color: "var(--fg-subtle)" }} aria-hidden />
            <Command.Input
              ref={inputRef}
              autoFocus
              placeholder="Search students, staff, fees, exams, books, assets, rooms, routes…"
              className="cmdk__input"
            />
            <kbd className="kbd">esc</kbd>
          </div>

          <Command.List className="cmdk__list max-h-[400px]">
            <Command.Empty className="cmdk__empty">
              No matches. Try a different search.
            </Command.Empty>

            {recents.length > 0 ? (
              <Command.Group
                heading={<GroupHeading label="Recent" count={recents.length} />}
                forceMount={false}
              >
                {recents.map((r) => (
                  <PaletteItem key={`recent-${r.id}-${r.to}`} onSelect={() => run(r)}>
                    <span className="cmdk__item-icon">
                      <History size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{r.label}</span>
                    <span className="cmdk__hint">
                      <kbd className="kbd">↵</kbd>
                    </span>
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            <Command.Group heading={<GroupHeading label="Pages" count={PAGES.length} />}>
              {PAGES.map((p) => {
                const Icon = p.icon;
                return (
                  <PaletteItem key={p.id} onSelect={() => run(p)}>
                    <span className="cmdk__item-icon">
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{p.label}</span>
                    <span className="cmdk__hint">
                      <kbd className="kbd">↵</kbd>
                    </span>
                  </PaletteItem>
                );
              })}
            </Command.Group>

            {studentItems.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Students" count={studentItems.length} />}>
                {studentItems.map((s) => (
                  <PaletteItem key={`student-${s.id}`} onSelect={() => run(s)}>
                    <span className="cmdk__item-icon">
                      <GraduationCap size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{s.label}</span>
                    {s.sub ? <span className="cmdk__item-sub mono tnum">{s.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {staffItems.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Staff" count={staffItems.length} />}>
                {staffItems.map((s) => (
                  <PaletteItem key={`staff-${s.id}`} onSelect={() => run(s)}>
                    <span className="cmdk__item-icon">
                      <Briefcase size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{s.label}</span>
                    {s.sub ? <span className="cmdk__item-sub">{s.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {classItems.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Classes" count={classItems.length} />}>
                {classItems.map((c) => (
                  <PaletteItem key={`class-${c.id}`} onSelect={() => run(c)}>
                    <span className="cmdk__item-icon">
                      <School size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{c.label}</span>
                    {c.sub ? <span className="cmdk__item-sub">{c.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {feeRecords.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Fees" count={feeRecords.length} />}>
                {feeRecords.map((f) => (
                  <PaletteItem key={`fee-${f.id}`} onSelect={() => run(f)}>
                    <span className="cmdk__item-icon">
                      <IndianRupee size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{f.label}</span>
                    {f.sub ? <span className="cmdk__item-sub">{f.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {exams.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Exams" count={exams.length} />}>
                {exams.map((e) => (
                  <PaletteItem key={`exam-${e.id}`} onSelect={() => run(e)}>
                    <span className="cmdk__item-icon">
                      <FileText size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{e.label}</span>
                    {e.sub ? <span className="cmdk__item-sub">{e.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {books.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Library Books" count={books.length} />}>
                {books.map((b) => (
                  <PaletteItem key={`book-${b.id}`} onSelect={() => run(b)}>
                    <span className="cmdk__item-icon">
                      <Library size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{b.label}</span>
                    {b.sub ? <span className="cmdk__item-sub">{b.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {assets.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Inventory Assets" count={assets.length} />}>
                {assets.map((a) => (
                  <PaletteItem key={`asset-${a.id}`} onSelect={() => run(a)}>
                    <span className="cmdk__item-icon">
                      <Package size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{a.label}</span>
                    {a.sub ? <span className="cmdk__item-sub">{a.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {rooms.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Hostel Rooms" count={rooms.length} />}>
                {rooms.map((r) => (
                  <PaletteItem key={`room-${r.id}`} onSelect={() => run(r)}>
                    <span className="cmdk__item-icon">
                      <Home size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{r.label}</span>
                    {r.sub ? <span className="cmdk__item-sub">{r.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {routes.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Transport Routes" count={routes.length} />}>
                {routes.map((r) => (
                  <PaletteItem key={`route-${r.id}`} onSelect={() => run(r)}>
                    <span className="cmdk__item-icon">
                      <Bus size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{r.label}</span>
                    {r.sub ? <span className="cmdk__item-sub">{r.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            {announcements.length > 0 ? (
              <Command.Group heading={<GroupHeading label="Announcements" count={announcements.length} />}>
                {announcements.map((a) => (
                  <PaletteItem key={`announcement-${a.id}`} onSelect={() => run(a)}>
                    <span className="cmdk__item-icon">
                      <Bell size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{a.label}</span>
                    {a.sub ? <span className="cmdk__item-sub">{a.sub}</span> : null}
                  </PaletteItem>
                ))}
              </Command.Group>
            ) : null}

            <Command.Group heading={<GroupHeading label="Settings" count={SETTINGS.length} />}>
              {SETTINGS.map((s) => (
                <PaletteItem key={s.id} onSelect={() => run(s)}>
                  <span className="cmdk__item-icon">
                    <SettingsIcon size={14} aria-hidden />
                  </span>
                  <span className="cmdk__item-label">{s.label}</span>
                </PaletteItem>
              ))}
            </Command.Group>

            <Command.Group heading={<GroupHeading label="Actions" count={ACTIONS.length} />}>
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <PaletteItem key={a.id} onSelect={() => run(a)}>
                    <span className="cmdk__item-icon">
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="cmdk__item-label">{a.label}</span>
                    <span className="cmdk__hint">
                      <kbd className="kbd">↵</kbd>
                    </span>
                  </PaletteItem>
                );
              })}
            </Command.Group>
          </Command.List>

          <div className="cmdk__foot" aria-hidden>
            <span className="cmdk__foot-item">
              <kbd className="kbd">
                <ArrowUpDown size={9} />
              </kbd>{" "}
              Navigate
            </span>
            <span className="cmdk__foot-item">
              <kbd className="kbd">
                <CornerDownLeft size={9} />
              </kbd>{" "}
              Open
            </span>
            <span className="cmdk__foot-spacer" />
            <span className="cmdk__foot-item">
              <kbd className="kbd">esc</kbd> Close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
