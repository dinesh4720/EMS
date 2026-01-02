import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Search, Command } from "lucide-react";
import { useLocation } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";
import { AiAssistantToggle } from "./AiAssistant/AiAssistantPanel";

export default function Topbar() {
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
            <div className="flex-1 flex items-center justify-end gap-2">
                {/* AI Assistant Toggle Button */}
                <AiAssistantToggle />
            </div>
        </div>
    );
}
