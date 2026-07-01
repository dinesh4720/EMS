import { memo, useState } from "react";
import PropTypes from "prop-types";
import { LogOut, Settings, Building2, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Popover from "../ui/Popover";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { resetCoachMarks } from "../ui/CoachMark";

/**
 * UserMenu — avatar trigger + signed-in user popover for the nav shell.
 *
 * Renders a dense bare-button menu (no HeroUI Dropdown / Navbar). Designed
 * to drop into the 44px topbar on the right and the sidebar foot on the
 * left. Pass `showSchoolSwitcher` for super-admin accounts to surface the
 * cross-tenant switcher entry.
 */
const UserMenu = memo(function UserMenu({
  collapsed = false,
  placement,
  avatarSrc,
  className,
  showSchoolSwitcher = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const resolvedPlacement = placement || (collapsed ? "right" : "top-start");

  const close = () => setIsOpen(false);

  return (
    <Popover
      placement={resolvedPlacement}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      offset={6}
      contentClassName="p-0 border-0 bg-transparent shadow-none"
      trigger={
        <button
          type="button"
          aria-label={t("components.userMenu", "User menu")}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={cn(
            "flex items-center transition-all focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 rounded-md",
            collapsed
              ? "h-9 justify-center w-9 mx-auto hover:bg-surface-hover"
              : "h-7 px-1 gap-2 hover:bg-surface-hover",
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
            <span className="text-[12.5px] font-medium text-fg truncate max-w-[120px] hidden md:inline">
              {user?.name || "User"}
            </span>
          )}
        </button>
      }
    >
      <div className="usermenu" role="menu">
        <div className="usermenu__head">
          <Avatar src={avatarSrc} name={user?.name || "User"} size="sm" />
          <div className="usermenu__head-text">
            <span className="usermenu__head-name">{user?.name || "User"}</span>
            <span className="usermenu__head-email">
              {user?.email || t("components.signedInAs")}
            </span>
          </div>
        </div>

        {showSchoolSwitcher && (
          <>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                navigate("/super-admin");
              }}
              className="usermenu__item"
            >
              <Building2 size={13} aria-hidden />
              {t("components.switchSchool", "Switch school")}
            </button>
            <div className="usermenu__sep" />
          </>
        )}

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            close();
            navigate("/settings");
          }}
          className="usermenu__item"
        >
          <Settings size={13} aria-hidden />
          {t("sidebar.mySettings", "My Settings")}
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            close();
            resetCoachMarks();
          }}
          className="usermenu__item"
        >
          <Lightbulb size={13} aria-hidden />
          {t("components.showProductTips", "Show product tips")}
        </button>

        <div className="usermenu__sep" />

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            close();
            logout();
          }}
          className="usermenu__item usermenu__item--danger"
        >
          <LogOut size={13} aria-hidden />
          {t("sidebar.logOut", "Log Out")}
        </button>
      </div>
    </Popover>
  );
});

UserMenu.displayName = "UserMenu";

UserMenu.propTypes = {
  collapsed: PropTypes.bool,
  placement: PropTypes.string,
  avatarSrc: PropTypes.string,
  className: PropTypes.string,
  showSchoolSwitcher: PropTypes.bool,
};

export default UserMenu;
