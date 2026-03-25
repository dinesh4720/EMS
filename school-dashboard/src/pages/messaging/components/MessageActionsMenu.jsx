import { useRef } from 'react';
import { MoreVertical, Edit2, Trash2, Reply, Forward, Pin, Copy, Download } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/react';
import { useTranslation } from 'react-i18next';

export default function MessageActionsMenu({
  message, currentUserId, onAction }) {
  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  const isOwnMessage = message.senderId?._id === currentUserId || message.senderId === currentUserId;

  const handleAction = (action) => {
    // Always pass message from props - DropdownMenu only gives us the key, not the message
    onAction(action, { message });
  };

  const actions = [
    {
      key: 'reply',
      icon: <Reply size={16} />,
      label: 'Reply',
      color: 'default',
      show: true
    },
    {
      key: 'forward',
      icon: <Forward size={16} />,
      label: 'Forward',
      color: 'default',
      show: true
    },
    {
      key: message.pinned ? 'unpin' : 'pin',
      icon: <Pin size={16} />,
      label: message.pinned ? 'Unpin' : 'Pin',
      color: 'default',
      show: true
    },
    {
      key: 'copy',
      icon: <Copy size={16} />,
      label: 'Copy text',
      color: 'default',
      show: true
    },
    {
      key: 'edit',
      icon: <Edit2 size={16} />,
      label: 'Edit',
      color: 'default',
      show: isOwnMessage && !message.isDeleted
    },
    {
      key: 'delete',
      icon: <Trash2 size={16} />,
      label: 'Delete',
      color: 'danger',
      show: isOwnMessage && !message.isDeleted
    },
    {
      key: 'download',
      icon: <Download size={16} />,
      label: 'Download',
      color: 'default',
      show: message.type === 'file' || message.type === 'image'
    }
  ];

  const visibleActions = actions.filter(action => action.show);

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-gray-400 transition-all duration-150 opacity-0 group-hover:opacity-100 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={18} />
          </button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label={t('aria.menus.messageActions')}
          onAction={(key) => handleAction(key)}
          className="min-w-48 p-1 rounded-xl border border-gray-200 dark:border-zinc-700 dark:shadow-zinc-900/50"
          itemClasses={{
            base: "rounded-lg px-3 py-2.5 text-sm data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-zinc-700 transition-colors",
          }}
        >
          <DropdownSection showDivider className="pb-1">
            {visibleActions.slice(0, 4).map((action) => (
              <DropdownItem
                key={action.key}
                startContent={<span className="text-gray-500 dark:text-gray-400">{action.icon}</span>}
                color={action.color}
              >
                {action.label}
              </DropdownItem>
            ))}
          </DropdownSection>
          <DropdownSection className="pt-1">
            {visibleActions.slice(4).map((action) => (
              <DropdownItem
                key={action.key}
                startContent={<span className={action.color === 'danger' ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'}>{action.icon}</span>}
                color={action.color}
                className={action.color === 'danger' ? 'text-rose-500 data-[hover=true]:text-rose-600 data-[hover=true]:bg-rose-50 dark:data-[hover=true]:bg-rose-500/10' : ''}
              >
                {action.label}
              </DropdownItem>
            ))}
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
