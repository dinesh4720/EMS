import React, { useState, useEffect } from "react";
import { Search, Command, ChevronRight, MessageCircle, Bell } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";
import { AiAssistantToggle } from "./AiAssistant/AiAssistantPanel";
import { useChatNotifications } from "../context/ChatNotificationContext";
import { Tooltip, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import NotificationCenter from "../pages/messaging/components/notifications/NotificationCenter";
import { useApp } from "../context/AppContext";
import { isObjectId } from "../utils/objectIdHelper";
import { studentsApi } from "../services/api";

function Topbar({ isSidebarOpen }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const chatNotifications = useChatNotifications();
    const unreadCount = chatNotifications?.unreadCount || 0;
    const { staff } = useApp();
    const [resolvedStudentLabel, setResolvedStudentLabel] = useState(null);

    useEffect(() => {
        setNotificationUnreadCount(3);
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
            "accounts": "Accounts"
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
            className="
                fixed top-0 right-0 z-40 h-14 px-5
                flex items-center justify-between
                bg-white
                border-b border-gray-200
                transition-all duration-300
            "
            style={{ left: isSidebarOpen ? '240px' : '64px' }}
        >
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Left: Breadcrumbs */}
            <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center gap-2 shrink-0">
                        {index > 0 && (
                            <ChevronRight size={14} className="text-gray-300" />
                        )}
                        <Link
                            to={crumb.path}
                            className={`font-medium transition-colors truncate max-w-[140px] ${
                                index === breadcrumbs.length - 1
                                    ? "text-gray-800"
                                    : "text-gray-500 hover:text-gray-700"
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
                    className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus-within:border-gray-400 transition-colors w-full max-w-xs hover:bg-gray-50"
                >
                    <Search className="text-gray-400" size={16} />
                    <span className="text-gray-400 text-sm flex-1 text-left">Search...</span>
                    <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
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
                        if (open) setNotificationUnreadCount(0);
                    }}
                    placement="bottom-end"
                    offset={8}
                    shouldBlockScroll={false}
                >
                    <PopoverTrigger>
                        <button className="relative h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell size={16} />
                            {notificationUnreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-900 rounded-full" />
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
                        className="relative h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MessageCircle size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                        )}
                    </button>
                </Tooltip>

                {/* Divider */}
                <div className="h-5 w-px bg-gray-200 mx-2" />

                {/* AI Assistant Toggle Button */}
                <AiAssistantToggle />
            </div>
        </header>
    );
}

export default React.memo(Topbar);
