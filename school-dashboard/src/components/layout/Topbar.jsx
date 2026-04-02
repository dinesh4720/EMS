import React, { useState, useEffect } from "react";
import { Search, Command, ChevronRight, MessageCircle, Bell, Globe, Check } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GlobalSearch from "./GlobalSearch";
import { AiAssistantToggle } from "../AiAssistant/AiAssistantPanel";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { Tooltip, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import NotificationCenter from "../../pages/messaging/components/notifications/NotificationCenter";
import { useApp } from "../../context/AppContext";
import { isObjectId } from "../../utils/objectIdHelper";
import { studentsApi, notificationsApi } from "../../services/api";
import { SUPPORTED_LANGUAGES, setLanguage } from "../../i18n";

function Topbar({ isSidebarOpen }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const chatNotifications = useChatNotifications();
    const unreadCount = chatNotifications?.unreadCount || 0;
    const { staff } = useApp();
    const [resolvedStudentLabel, setResolvedStudentLabel] = useState(null);

    useEffect(() => {
        const fetchUnreadCount = () => {
            notificationsApi.getAll()
                .then((data) => {
                    const list = Array.isArray(data) ? data : [];
                    setNotificationUnreadCount(list.filter(n => !n.read).length);
                })
                .catch(() => {
                    setNotificationUnreadCount(0);
                });
        };

        fetchUnreadCount();

        // Poll every 60 seconds for new notifications
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const parts = location.pathname.split("/").filter(Boolean);
        const studentIndex = parts.indexOf("students");
        const studentId = studentIndex >= 0 ? parts[studentIndex + 1] : null;

        if (
            !studentId ||
            studentId === "attendance" ||
            studentId === "submissions" ||
            (!isObjectId(studentId) && !/^[a-f\d]{20,}$/i.test(studentId))
        ) {
            setResolvedStudentLabel(null);
            return;
        }

        let isActive = true;

        studentsApi.getById(studentId)
            .then((student) => {
                if (!isActive) {
                    return;
                }

                const label = student?.name && !isObjectId(student.name)
                    ? student.name
                    : student?.admissionId
                        ? `Student ${student.admissionId}`
                        : `...${studentId.slice(-8)}`;

                setResolvedStudentLabel({ id: studentId, label });
            })
            .catch(() => {
                if (isActive) {
                    setResolvedStudentLabel({ id: studentId, label: `...${studentId.slice(-8)}` });
                }
            });

        return () => {
            isActive = false;
        };
    }, [location.pathname]);

    const getBreadcrumbs = () => {
        const path = location.pathname;
        const parts = path.split("/").filter(Boolean);

        const pathMap = {
            "staffs": "Staff",
            "students": "Students",
            "classes": "Classes",
            "calendar": "Schedule",
            "messaging": "Messages",
            "fees": "Fees",
            "settings": "Settings",
            "front-desk": "Front Desk",
            "analytics": "Analytics",
            "accounts": "Accounts",
            "hostel": "Hostel",
            "transport": "Transport",
            "library": "Library"
        };

        if (parts.length === 0) return [{ label: "Dashboard", path: "/" }];

        return parts.map((part, index) => {
            const currentPath = `/${parts.slice(0, index + 1).join("/")}`;
            let label = pathMap[part] || part.charAt(0).toUpperCase() + part.slice(1);
            
            // If this looks like an ObjectId or MongoDB ID, try to resolve it to a name
            if (isObjectId(part) || /^[a-f\d]{20,}$/i.test(part)) {
                const prevPart = parts[index - 1];
                
                // Check if it's a staff ID
                if (prevPart === 'staffs' && staff) {
                    const staffMember = staff.find(s => s.id === part || s._id === part);
                    if (staffMember && staffMember.name && !isObjectId(staffMember.name)) {
                        label = staffMember.name;
                    } else if (staffMember && staffMember.code) {
                        label = `Staff ${staffMember.code}`;
                    }
                }
                // Check if it's a student ID
                else if (prevPart === 'students' && resolvedStudentLabel?.id === part) {
                    label = resolvedStudentLabel.label;
                }
                // If we couldn't resolve it, show a shortened version
                else {
                    label = `...${part.slice(-8)}`;
                }
            }
            
            return {
                label,
                path: currentPath
            };
        });
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <header
            aria-label="Application header"
            className="
                fixed top-0 right-0 z-40 h-14 px-5
                flex items-center justify-between
                bg-white dark:bg-zinc-950
                border-b border-gray-200 dark:border-zinc-800
                transition-all duration-300
            "
            style={{ left: isSidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-width-collapsed)' }}
        >
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Left: Breadcrumbs */}
            <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center gap-2 shrink-0">
                        {index > 0 && (
                            <ChevronRight size={14} className="text-gray-300 dark:text-zinc-600" />
                        )}
                        <Link
                            to={crumb.path}
                            className={`font-medium transition-colors truncate max-w-[140px] ${
                                index === breadcrumbs.length - 1
                                    ? "text-gray-800 dark:text-zinc-200"
                                    : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                        >
                            {crumb.label}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Center: Search */}
            <div className="flex-1 flex justify-center max-w-md">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus-within:border-gray-400 transition-colors w-full max-w-xs hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                    <Search className="text-gray-400 dark:text-zinc-500" size={16} />
                    <span className="text-gray-400 dark:text-zinc-500 text-sm flex-1 text-left">Search...</span>
                    <div className="flex items-center gap-1 text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700">
                        <Command size={11} />
                        <span className="text-[10px] font-medium">K</span>
                    </div>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-1">
                {/* Notifications */}
                <Popover
                    isOpen={isNotificationOpen}
                    onOpenChange={(open) => {
                        setIsNotificationOpen(open);
                        // Reset badge when closing (user has seen notifications)
                        if (!open) setNotificationUnreadCount(0);
                    }}
                    placement="bottom-end"
                    offset={8}
                    shouldBlockScroll={false}
                >
                    <PopoverTrigger>
                        <button
                            data-tour="notifications"
                            aria-label={notificationUnreadCount > 0 ? `${notificationUnreadCount} unread notifications` : 'Notifications'}
                            className="relative h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <Bell size={16} />
                            {notificationUnreadCount > 0 && (
                                <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-900 dark:bg-zinc-100 rounded-full" />
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[380px]">
                        <NotificationCenter onClose={() => setIsNotificationOpen(false)} isPopover={true} />
                    </PopoverContent>
                </Popover>

                {/* Chat Button */}
                <Tooltip
                    content={unreadCount > 0 ? `${unreadCount} unread` : "Messages"}
                    placement="bottom"
                >
                    <button
                        onClick={() => navigate('/messaging')}
                        className="relative h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <MessageCircle size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                        )}
                    </button>
                </Tooltip>

                {/* Language Switcher — hidden while i18n is disabled */}
                {/* TODO: Re-enable when I18N_ENABLED is set to true in i18n/index.js */}
                {false && (
                <Popover
                    isOpen={isLangOpen}
                    onOpenChange={setIsLangOpen}
                    placement="bottom-end"
                    offset={8}
                    shouldBlockScroll={false}
                >
                    <PopoverTrigger>
                        <button className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <Globe size={16} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[180px]">
                        <div className="py-1">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsLangOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <span className={`${i18n.language === lang.code ? 'text-gray-900 dark:text-zinc-100 font-medium' : 'text-gray-600 dark:text-zinc-400'}`}>
                                        {lang.name}
                                    </span>
                                    {i18n.language === lang.code && (
                                        <Check size={14} className="text-gray-900 dark:text-zinc-100" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
                )}

                {/* Divider */}
                <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-2" />

                {/* AI Assistant Toggle Button */}
                <AiAssistantToggle />
            </div>
        </header>
    );
}

export default React.memo(Topbar);
