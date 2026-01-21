import { useState, useEffect } from "react";
import { Search, Command, ChevronRight, MessageCircle, Bell } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";
import { AiAssistantToggle } from "./AiAssistant/AiAssistantPanel";
import { useChatNotifications } from "../context/ChatNotificationContext";
import { Tooltip, Badge, Button, Popover, PopoverTrigger, PopoverContent, Chip } from "@heroui/react";
import NotificationCenter from "../pages/messaging/components/notifications/NotificationCenter";

export default function Topbar({ isSidebarOpen }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const chatNotifications = useChatNotifications();
    const unreadCount = chatNotifications?.unreadCount || 0;

    useEffect(() => {
        // Mock notification count - in real app, fetch from API
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

    const getBreadcrumbs = () => {
        const path = location.pathname;
        const parts = path.split("/").filter(Boolean);

        // Map common paths to readable names
        const pathMap = {
            "staffs": "Staff Management",
            "students": "Student Directory",
            "classes": "Class Management",
            "calendar": "Schedule",
            "messaging": "Communication",
            "fees": "Finance",
            "settings": "Settings",
            "front-desk": "Front Desk",
            "analytics": "Analytics",
            "accounts": "Accounts"
        };

        if (parts.length === 0) return [{ label: "Dashboard", path: "/" }];

        return parts.map((part, index) => {
            const currentPath = `/${parts.slice(0, index + 1).join("/")}`;
            return {
                label: pathMap[part] || part.charAt(0).toUpperCase() + part.slice(1),
                path: currentPath
            };
        });
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <header
            className="fixed top-0 right-0 z-40 h-14 px-6 border-b border-default-200 dark:border-default-100/50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between transition-all duration-300"
            style={{ left: isSidebarOpen ? '260px' : '68px' }}
        >
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Left: Breadcrumbs */}
            <div className="flex-1 flex items-center gap-2 text-sm">
                <Link to="/" className="text-default-500 hover:text-foreground transition-colors font-medium">
                    Home
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-default-400" />
                        <Link
                            to={crumb.path}
                            className={`font-medium transition-colors ${index === breadcrumbs.length - 1
                                ? "text-foreground"
                                : "text-default-500 hover:text-foreground"
                                }`}
                        >
                            {crumb.label}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Center: Search */}
            <div className="flex-1 flex justify-center">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="group flex items-center gap-2 px-3 py-1.5 bg-default-50 hover:bg-default-100 border border-default-200 dark:border-default-800 rounded-lg transition-all w-80"
                >
                    <Search className="text-default-400 group-hover:text-default-600 transition-colors" size={14} />
                    <span className="text-default-400 text-xs font-medium flex-1 text-left group-hover:text-default-600">Search...</span>
                    <div className="flex items-center gap-1 text-default-400 bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-default-200 dark:border-default-800">
                        <Command size={10} />
                        <span className="text-[10px] font-bold">K</span>
                    </div>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-2">
                {/* Notifications */}
                <Popover
                    isOpen={isNotificationOpen}
                    onOpenChange={(open) => {
                        setIsNotificationOpen(open);
                        if (open) setNotificationUnreadCount(0); // Mark as read when opened
                    }}
                    placement="bottom-end"
                    offset={10}
                    shouldBlockScroll={false}
                >
                    <PopoverTrigger>
                        <Button
                            isIconOnly
                            radius="lg"
                            variant="light"
                            className="h-9 w-9"
                        >
                            <div className="relative">
                                <Bell size={18} className="text-default-600" />
                                {notificationUnreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-background">
                                        {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                    </span>
                                )}
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[400px]">
                        <NotificationCenter onClose={() => setIsNotificationOpen(false)} isPopover={true} />
                    </PopoverContent>
                </Popover>

                {/* Chat Button */}
                <Tooltip 
                    content={unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : "Messages"} 
                    placement="bottom"
                    classNames={{
                        content: unreadCount > 0 ? "bg-red-500 text-white font-semibold" : ""
                    }}
                >
                    <button
                        onClick={() => navigate('/messaging')}
                        className="relative p-2 hover:bg-default-100 rounded-lg transition-colors"
                    >
                        <MessageCircle size={20} className="text-default-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </Tooltip>
                
                {/* AI Assistant Toggle Button */}
                <AiAssistantToggle />
            </div>
        </header>
    );
}
