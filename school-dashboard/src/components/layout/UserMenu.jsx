import { memo, useState } from "react";
import PropTypes from "prop-types";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

/**
 * UserMenu — avatar trigger + signed-in user popover for the nav shell.
 *
 * Displays the current user's avatar and (optionally) their name/role. The
 * popover shows the signed-in email, a Settings shortcut, and Log out.
 * Used primarily in the Sidebar bottom section.
 */
const UserMenu = memo(function UserMenu({
  collapsed = false,
  placement,
  avatarSrc,
  className,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const resolvedPlacement = placement || (collapsed ? "right" : "top-start");

  return (
    <Popover
      placement={resolvedPlacement}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      offset={8}
      showArrow
    >
      <PopoverTrigger>
        <button
          type="button"
          aria-label={t("components.userMenu", "User menu")}
          className={cn(
            "flex items-center transition-all focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30",
            collapsed
              ? "h-10 justify-center w-10 mx-auto rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              : "w-full py-2 px-2 gap-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg mt-1",
            className
          )}
        >
          <Avatar
            src={avatarSrc}
            name={user?.name || "Admin"}
            size="xs"
            className="shrink-0"
          />
          {!collapsed && (
            <div className="flex-1 flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                {user?.name || "User"}
              </span>
              <span className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                {user?.role || "Staff"}
              </span>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="min-w-[200px] rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {t("components.signedInAs")}
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
              {user?.email}
            </p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("sidebar.mySettings", "My Settings")}
            </button>
            <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors flex items-center gap-2"
            >
              <LogOut size={14} />
              {t("sidebar.logOut", "Log Out")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

UserMenu.displayName = "UserMenu";

UserMenu.propTypes = {
  collapsed: PropTypes.bool,
  placement: PropTypes.string,
  avatarSrc: PropTypes.string,
  className: PropTypes.string,
};

export default UserMenu;
