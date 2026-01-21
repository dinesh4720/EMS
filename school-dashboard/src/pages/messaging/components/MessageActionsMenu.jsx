import { useRef } from 'react';
import { MoreVertical, Edit2, Trash2, Reply, Forward, Pin, Copy, Download } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/react';

export default function MessageActionsMenu({ message, currentUserId, onAction }) {
  const dropdownRef = useRef(null);

  const isOwnMessage = message.senderId?._id === currentUserId || message.senderId === currentUserId;

  const handleAction = (action) => {
    console.log('🎯 Action clicked:', action);
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
      key: 'pin',
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
      <Dropdown>
        <DropdownTrigger>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-default-100 text-default-500 transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={18} />
          </button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Message actions"
          onAction={(key) => handleAction(key)}
          className="min-w-48"
        >
          <DropdownSection>
            {visibleActions.map((action) => (
              <DropdownItem
                key={action.key}
                startContent={action.icon}
                color={action.color}
                className={action.color === 'danger' ? 'text-danger' : ''}
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
