import { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, ModalContent, ModalBody, Kbd } from "@heroui/react";
import { Search, User, Users, GraduationCap, BookOpen, CreditCard, MessageSquare, Settings, Home, X, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const navigationItems = [
  { name: "Dashboard", path: "/", icon: Home, category: "Navigation" },
  { name: "Staff List", path: "/staffs", icon: Users, category: "Navigation" },
  { name: "Staff Overview", path: "/staffs/overview", icon: Users, category: "Navigation" },
  { name: "Classes List", path: "/classes", icon: BookOpen, category: "Navigation" },
  { name: "Class Attendance", path: "/classes/attendance", icon: BookOpen, category: "Navigation" },
  { name: "Timetable", path: "/classes/timetable", icon: BookOpen, category: "Navigation" },
  { name: "Calendar", path: "/calendar", icon: Calendar, category: "Navigation" },
  { name: "Collect Fees", path: "/fees/collect", icon: CreditCard, category: "Navigation" },
  { name: "Fee Defaulters", path: "/fees/defaulters", icon: CreditCard, category: "Navigation" },
  { name: "Fee Reports", path: "/fees/reports", icon: CreditCard, category: "Navigation" },
  { name: "Fee Setup", path: "/fees/setup", icon: CreditCard, category: "Navigation" },
  { name: "Announcements", path: "/messaging/announcements", icon: MessageSquare, category: "Navigation" },
  { name: "Reminders", path: "/messaging/reminders", icon: MessageSquare, category: "Navigation" },
  { name: "Communication Logs", path: "/messaging/logs", icon: MessageSquare, category: "Navigation" },
  { name: "Institution Settings", path: "/settings/institution", icon: Settings, category: "Navigation" },
  { name: "Roles & Access", path: "/settings/roles", icon: Settings, category: "Navigation" },
  { name: "Fee Rules", path: "/settings/fee-rules", icon: Settings, category: "Navigation" },
  { name: "Attendance Rules", path: "/settings/attendance-rules", icon: Settings, category: "Navigation" },
];

export default function GlobalSearch({ isOpen, onClose }) {
  const { staff: staffData, students: studentsData, classesWithTeachers: classesData } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!query.trim()) return { navigation: navigationItems.slice(0, 5), staff: [], students: [], classes: [] };
    
    const q = query.toLowerCase();
    
    const navigation = navigationItems.filter(item => 
      item.name.toLowerCase().includes(q)
    );
    
    const staff = staffData.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.code.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q))
    ).map(s => ({ ...s, category: "Staff" }));
    
    const students = studentsData.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.class.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(q))
    ).map(s => ({ ...s, category: "Students" }));
    
    const classes = classesData.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.section.toLowerCase().includes(q) ||
      c.teacher.toLowerCase().includes(q)
    ).map(c => ({ ...c, category: "Classes" }));
    
    return { navigation, staff, students, classes };
  }, [query, staffData, studentsData, classesData]);

  const allResults = useMemo(() => {
    return [
      ...searchResults.navigation,
      ...searchResults.staff,
      ...searchResults.students,
      ...searchResults.classes,
    ];
  }, [searchResults]);

  const handleSelect = useCallback((item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.category === "Staff") {
      navigate(`/staffs/${item.id}`);
    } else if (item.category === "Students") {
      navigate(`/students/${item.id}`);
    } else if (item.category === "Classes") {
      navigate(`/classes/${item.id}`);
    }
    onClose();
    setQuery("");
  }, [navigate, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(allResults[selectedIndex]);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allResults, selectedIndex, handleSelect]);

  const renderItem = (item, index, globalIndex) => {
    const isSelected = globalIndex === selectedIndex;
    const Icon = item.icon || (item.category === "Staff" ? User : item.category === "Students" ? GraduationCap : BookOpen);
    
    return (
      <button
        key={item.id || item.path || index}
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
            <p className="text-xs text-default-400">{item.department} • {item.role}</p>
          )}
          {item.category === "Students" && (
            <p className="text-xs text-default-400">Class {item.class} • Roll #{item.rollNo}</p>
          )}
          {item.category === "Classes" && (
            <p className="text-xs text-default-400">{item.name} {item.section} • {item.teacher}</p>
          )}
        </div>
        {item.category === "Navigation" && (
          <Kbd className="text-[10px]">↵</Kbd>
        )}
      </button>
    );
  };

  const renderSection = (title, items, startIndex) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-medium text-default-400 px-3 mb-1.5">{title}</p>
        {items.map((item, i) => renderItem(item, i, startIndex + i))}
      </div>
    );
  };

  let currentIndex = 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { onClose(); setQuery(""); }}
      size="lg"
      placement="top"
      classNames={{
        base: "mt-20",
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
      hideCloseButton
    >
      <ModalContent>
        <ModalBody className="p-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-default-200">
            <Search size={18} className="text-default-400" />
            <input
              autoFocus
              type="search"
              name="global-search-query"
              autoComplete="off"
              data-form-type="other"
              placeholder="Search students, staff, classes, or pages..."
              className="flex-1 bg-transparent outline-none text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={() => { onClose(); setQuery(""); }} className="p-1 hover:bg-default-100 rounded">
              <X size={16} className="text-default-400" />
            </button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-2">
            {allResults.length === 0 ? (
              <div className="py-8 text-center text-default-400">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : (
              <>
                {renderSection("Pages", searchResults.navigation, (currentIndex = 0, currentIndex))}
                {renderSection("Staff", searchResults.staff, (currentIndex += searchResults.navigation.length, currentIndex))}
                {renderSection("Students", searchResults.students, (currentIndex += searchResults.staff.length, currentIndex))}
                {renderSection("Classes", searchResults.classes, (currentIndex += searchResults.students.length, currentIndex))}
              </>
            )}
          </div>
          
          <div className="flex items-center justify-between px-4 py-2 border-t border-default-200 text-xs text-default-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> Navigate</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> Select</span>
              <span className="flex items-center gap-1"><Kbd>Esc</Kbd> Close</span>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
