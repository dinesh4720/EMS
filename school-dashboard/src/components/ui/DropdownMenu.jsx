import { memo } from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu as HeroDropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/react";

/**
 * DropdownMenu — design-system wrapper around HeroUI Dropdown.
 *
 * Generic contextual-menu primitive. Pass `items` for a flat menu or
 * `sections` for a grouped menu. Use `FiltersDropdown` for the filter-bar
 * variant with presets/search.
 *
 * Item shape: { key, label, description?, icon?, shortcut?, color?, isDestructive?, isDisabled?, onClick }
 * Section shape: { key, title, showDivider?, items: Item[] }
 */
function renderItem(item) {
  const {
    key,
    label,
    description,
    icon,
    shortcut,
    color,
    isDestructive,
    isDisabled,
    onClick,
    ...rest
  } = item;

  return (
    <DropdownItem
      key={key || label}
      description={description}
      startContent={icon}
      shortcut={shortcut}
      color={isDestructive ? "danger" : color}
      className={isDestructive ? "text-danger" : undefined}
      isDisabled={isDisabled}
      onPress={onClick}
      {...rest}
    >
      {label}
    </DropdownItem>
  );
}

const DropdownMenu = memo(function DropdownMenu({
  trigger,
  items,
  sections,
  ariaLabel = "Menu",
  placement = "bottom-end",
  closeOnSelect = true,
  isDisabled,
  menuClassName,
  ...props
}) {
  return (
    <Dropdown placement={placement} isDisabled={isDisabled} {...props}>
      <DropdownTrigger>{trigger}</DropdownTrigger>
      {/* REVAMP-05: .ds-menu provides the frosted-glass surface so the
       * dropdown matches Modal/Drawer/Popover. */}
      <HeroDropdownMenu
        aria-label={ariaLabel}
        closeOnSelect={closeOnSelect}
        className={`ds-menu ${menuClassName || ""}`.trim()}
      >
        {sections
          ? sections.map((section, idx) => (
              <DropdownSection
                key={section.key || section.title || idx}
                title={section.title}
                showDivider={
                  section.showDivider ?? idx < sections.length - 1
                }
              >
                {(section.items || []).map(renderItem)}
              </DropdownSection>
            ))
          : (items || []).map(renderItem)}
      </HeroDropdownMenu>
    </Dropdown>
  );
});

DropdownMenu.displayName = "DropdownMenu";

const ItemShape = PropTypes.shape({
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  icon: PropTypes.node,
  shortcut: PropTypes.string,
  color: PropTypes.string,
  isDestructive: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func,
});

DropdownMenu.propTypes = {
  trigger: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(ItemShape),
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.node,
      showDivider: PropTypes.bool,
      items: PropTypes.arrayOf(ItemShape).isRequired,
    })
  ),
  ariaLabel: PropTypes.string,
  placement: PropTypes.string,
  closeOnSelect: PropTypes.bool,
  isDisabled: PropTypes.bool,
  menuClassName: PropTypes.string,
};

export default DropdownMenu;
