import { forwardRef, useMemo } from "react";
import { Search, X, Plus, Users, MessageCircle } from "lucide-react";
import { formatTime } from "../utils/chatUtils";
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Modal,
  Input,
  Tooltip,
  Chip,
  IconButton,
  EmptyState,
} from "../../../components/ui";

const ConversationListItem = forwardRef(function ConversationListItem(
  { conv, isActive, onSelect },
  ref
) {
  const previewText =
    conv.lastMessage?.content
    || (conv.lastMessage?.type === 'audio' ? '🎤 Voice message'
      : conv.lastMessage?.type === 'image' ? '📷 Photo'
      : conv.lastMessage?.type === 'video' ? '🎥 Video'
      : conv.lastMessage?.type === 'file' ? '📎 File'
      : 'No messages');

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(conv)}
      data-conv-id={conv.id || conv._id}
      className={`chat-list__row ${isActive ? 'is-active' : ''}`}
    >
      <Avatar
        src={conv.otherParticipant?.avatar}
        name={conv.otherParticipant?.name}
        size="md"
        status={conv.otherParticipant?.online ? 'online' : undefined}
      />
      <div className="col" style={{ flex: 1, minWidth: 0, lineHeight: 1.3, alignItems: 'flex-start' }}>
        <div className="row gap-2" style={{ width: '100%', minWidth: 0 }}>
          <span
            style={{
              fontWeight: 520,
              letterSpacing: '-0.01em',
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flex: 1,
            }}
          >
            {conv.otherParticipant?.name}
          </span>
          {conv.lastMessage?.timestamp && (
            <span className="mono tnum faint" style={{ fontSize: 11, flexShrink: 0 }}>
              {formatTime(conv.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="row gap-2" style={{ width: '100%', minWidth: 0 }}>
          <span
            className="subtle"
            style={{
              fontSize: 12,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {previewText}
          </span>
          {conv.unreadCount > 0 && (
            <span className="chip chip--accent mono tnum" style={{ fontSize: 10, padding: '1px 6px', flexShrink: 0 }}>
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

function NewChatModal({ isOpen, onClose, contacts, contactSearch, onContactSearchChange, onStartNewConversation }) {
  const { t } = useTranslation();
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
    || c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t('pages.startNewConversation2')}
      description={t('pages.selectAContactToBeginMessaging')}
    >
      <div className="space-y-4">
        <Input
          placeholder={t('pages.searchContactsByNameOrRole')}
          value={contactSearch}
          onChange={(e) => onContactSearchChange(e.target.value)}
          startContent={<Search size={16} />}
          aria-label={t('pages.searchContactsByNameOrRole')}
        />
        <div className="max-h-96 overflow-y-auto pr-1">
          {filteredContacts.length === 0 ? (
            <EmptyState
              icon={Users}
              size="sm"
              title={t('pages.noContactsFound')}
            />
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => onStartNewConversation(contact)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--color-primary)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                >
                  <Avatar src={contact.avatar} name={contact.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {contact.role}
                    </p>
                  </div>
                  <Chip size="sm" color="neutral" className="capitalize">
                    {contact.type}
                  </Chip>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

const ChatSidebar = forwardRef(function ChatSidebar(
  {
    conversations,
    selectedConversation,
    searchQuery,
    onSearchChange,
    onSelectConversation,
    socketConnected,
    showNewChatModal,
    onOpenNewChatModal,
    onCloseNewChatModal,
    contacts,
    contactSearch,
    onContactSearchChange,
    onStartNewConversation,
    searchInputRef,
    rowRefs,
    onListKeyDown,
  },
  listRef
) {
  const { t } = useTranslation();

  const filteredConversations = useMemo(
    () => conversations.filter(c =>
      c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  );

  return (
    <>
      <aside className="chat-shell__sidebar">
        <div className="chat-sidebar__head">
          <div className="flex items-center gap-2">
            <Input
              ref={searchInputRef}
              placeholder={t('pages.searchConversations')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              startContent={<Search size={16} />}
              endContent={searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label={t('common.clear', 'Clear')}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={14} />
                </button>
              ) : (
                <span className="kbd" aria-hidden style={{ fontSize: 9.5, padding: '0 4px' }}>/</span>
              )}
              wrapperClassName="flex-1"
              aria-label={t('pages.searchConversations')}
            />
            <Tooltip content={t('messaging.chat.newConversation', 'New conversation')}>
              <IconButton
                variant="primary"
                onClick={onOpenNewChatModal}
                aria-label={t('messaging.chat.newConversation', 'New conversation')}
              >
                <Plus size={18} />
              </IconButton>
            </Tooltip>
          </div>

          <div className={`chat-sidebar__status ${socketConnected ? '' : 'is-offline'}`}>
            <span className="dot" aria-hidden />
            <span>
              {socketConnected
                ? t('messaging.chat.connected', 'Connected')
                : t('messaging.chat.offlineMode', 'Offline mode')}
            </span>
            <span className="faint" style={{ marginLeft: 'auto' }}>
              <span className="mono tnum">{filteredConversations.length}</span>
              {' '}of <span className="mono tnum">{conversations.length}</span>
            </span>
          </div>
        </div>

        <div
          ref={listRef}
          role="listbox"
          aria-label={t('pages.conversations', 'Conversations')}
          tabIndex={0}
          onKeyDown={onListKeyDown}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ outline: 'none' }}
        >
          {filteredConversations.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              size="md"
              title={t('pages.noConversations')}
              description={t('pages.startANewChatToBeginMessaging')}
            />
          ) : (
            <div>
              {filteredConversations.map((conv) => {
                const id = conv.id || conv._id;
                return (
                  <ConversationListItem
                    key={id}
                    ref={(el) => {
                      if (!rowRefs) return;
                      if (el) rowRefs.current.set(id, el);
                      else rowRefs.current.delete(id);
                    }}
                    conv={conv}
                    isActive={selectedConversation?.id === conv.id || selectedConversation?._id === conv._id}
                    onSelect={onSelectConversation}
                  />
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={onCloseNewChatModal}
        contacts={contacts}
        contactSearch={contactSearch}
        onContactSearchChange={onContactSearchChange}
        onStartNewConversation={onStartNewConversation}
      />
    </>
  );
});

export default ChatSidebar;
