import { Avatar, Button, ScrollShadow, Chip } from "@heroui/react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, IndianRupee, Settings,
  ChevronsLeft, GraduationCap, Calendar
} from "lucide-react";
import AiAssistant from "./AiAssistant";

const mainNavItems = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/" },
  { icon: <Users size={18} />, label: "Staffs", href: "/staffs" },
  { icon: <GraduationCap size={18} />, label: "Students", href: "/students" },
  { icon: <BookOpen size={18} />, label: "Classes", href: "/classes" },
  { icon: <Calendar size={18} />, label: "Calendar", href: "/calendar" },
  { icon: <MessageSquare size={18} />, label: "Messaging", href: "/messaging", badge: "4" },
  { icon: <IndianRupee size={18} />, label: "Fees", href: "/fees" },
  { icon: <Settings size={18} />, label: "Settings", href: "/settings" },
];

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background/60 backdrop-blur-xl border-r border-default-300 dark:border-default-200 flex flex-col z-50 transition-all duration-300 ${isSidebarOpen ? 'w-60' : 'w-16'}`}>
      {/* Header */}
      <div className={`h-14 flex items-center border-b border-default-300 ${isSidebarOpen ? 'justify-start px-5 gap-2' : 'justify-center px-2'}`}>
        <div className="p-1 bg-gradient-to-br from-primary to-secondary rounded text-white shadow-lg">
          <GraduationCap size={18} />
        </div>
        <span className={`font-medium text-lg tracking-tight text-foreground/90 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>EduMaster</span>
      </div>
      {/* Main Navigation */}
      <ScrollShadow className="flex-1 px-4 space-y-8 scrollbar-hide py-4">
        <div>
          {isSidebarOpen && <p className="px-2 text-[10px] font-medium text-default-400 uppercase tracking-widest mb-2">Main Menu</p>}
          <ul className="space-y-1">
            {mainNavItems.map((item, index) => {
              const isActive = location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));

              return (
                <li key={index}>
                  <NavLink to={item.href}>
                    {({ isActive }) => (
                      <div className={`
                        flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 rounded transition-all duration-200 group relative
                        ${isActive
                          ? "bg-primary/10 text-primary font-medium shadow-sm"
                          : "text-default-500 hover:bg-default-100/50 hover:text-default-900"}
                      `}>
                        <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                          <span className={isActive ? "text-primary transition-transform group-hover:scale-110" : "text-default-400 group-hover:text-default-600 transition-transform group-hover:scale-110"}>
                            {item.icon}
                          </span>
                          {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                        </div>
                        {item.badge && isSidebarOpen && (
                          <Chip size="sm" variant="shadow" color="danger" className="h-5 min-w-5 px-0 flex items-center justify-center text-[10px] font-medium">
                            {item.badge}
                          </Chip>
                        )}
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollShadow>

      {/* AI Assistant */}
      <AiAssistant isCollapsed={!isSidebarOpen} />

      {/* Collapse Toggle */}
      <div className={`p-4 border-t border-default-100/50 flex ${isSidebarOpen ? 'justify-end' : 'justify-center'}`}>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-default-400 min-w-8 w-8 h-8 hover:text-foreground"
          onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronsLeft size={18} /> : <ChevronsLeft size={18} className="rotate-180" />}
        </Button>
      </div>
    </aside >
  );
}
