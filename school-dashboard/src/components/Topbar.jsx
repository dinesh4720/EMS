import { useState, useEffect } from "react";
import { Button, Badge, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Search, Bell, Settings, Command, Sun, Moon, GraduationCap } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";

export default function Topbar() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [searchOpen, setSearchOpen] = useState(false);

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

    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/") return "Dashboard";
        if (path.startsWith("/staffs")) return "Staffs";
        if (path.startsWith("/students")) return "Students";
        if (path.startsWith("/classes")) return "Classes";
        if (path.startsWith("/calendar")) return "Calendar";
        if (path.startsWith("/messaging")) return "Messaging";
        if (path.startsWith("/fees")) return "Fees";
        if (path.startsWith("/settings")) return "Settings";
        return "Dashboard";
    };

    return (
        <div className="h-12 px-4 border-b border-default-300 dark:border-default-200 bg-background/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between w-full">
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Left Title */}
            <div className="flex-1 flex items-center">
                <h2 className="text-base font-medium text-default-800 tracking-tight">
                    {getPageTitle()}
                </h2>
            </div>

            {/* Center Search */}
            <div className="flex-1 max-w-xl flex justify-center">
                <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-default-100 hover:bg-default-200 rounded-md transition-colors max-w-xs w-full"
                >
                    <Search className="text-default-400 flex-shrink-0" size={16} />
                    <span className="text-default-400 text-sm flex-1 text-left">Search...</span>
                    <div className="flex items-center gap-1 text-default-400 flex-shrink-0">
                        <Command size={12} />
                        <span className="text-[10px] font-mono">K</span>
                    </div>
                </button>
            </div>

            {/* Right Actions */}
            <div className="flex-1 flex items-center justify-end gap-3">
                <Button
                    isIconOnly
                    radius="full"
                    variant="light"
                    className="text-default-500"
                    aria-label="Toggle Theme"
                    size="sm"
                    onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </Button>

                <Button
                    isIconOnly
                    radius="full"
                    variant="light"
                    className="text-default-500"
                    aria-label="Settings"
                    size="sm"
                >
                    <Settings size={18} />
                </Button>

                <Badge content="4" color="danger" shape="circle" size="sm">
                    <Button
                        isIconOnly
                        radius="md"
                        variant="light"
                        className="text-default-500"
                        aria-label="Notifications"
                        size="sm"
                    >
                        <Bell size={18} />
                    </Button>
                </Badge>

                <div className="h-6 w-px bg-default-300 mx-1 hidden sm:block" />

                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Avatar
                            isBordered
                            as="button"
                            className="transition-transform ring-2 ring-transparent hover:ring-primary/20"
                            color="primary"
                            name={user?.name || "User"}
                            size="sm"
                            src={`https://i.pravatar.cc/150?u=${user?.id || 'default'}`}
                        />
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Profile Actions" variant="flat">
                        <DropdownItem key="profile" className="h-14 gap-2">
                            <p className="font-medium">Signed in as</p>
                            <p className="font-medium">{user?.email || "user@example.com"}</p>
                        </DropdownItem>
                        <DropdownItem key="settings">My Settings</DropdownItem>
                        <DropdownItem key="team_settings">Team Settings</DropdownItem>
                        <DropdownItem key="analytics">Analytics</DropdownItem>
                        <DropdownItem key="system">System</DropdownItem>
                        <DropdownItem key="configurations">Configurations</DropdownItem>
                        <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
                        <DropdownItem key="logout" color="danger" onPress={logout}>
                            Log Out
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
}
