import { ScrollShadow } from "@heroui/react";
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

const STATUS_LABEL = {
  connected: { dot: 'bg-green-500', label: 'Connected' },
  offline: { dot: 'bg-amber-500', label: 'Offline mode' },
};

function ConversationListItem({ conv, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conv)}
      className={`chat-list__row w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 ${
        isActive ? 'is-active' : ''
      }`}
    >
      <div className="relative shrink-0">
        <Avatar
          src={conv.otherParticipant?.avatar}
          name={conv.otherParticipant?.name}
          size="md"
          status={conv.otherParticipant?.online ? 'online' : undefined}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <span className="chat-list__name">
            {conv.otherParticipant?.name}
          </span>
          {conv.lastMessage?.timestamp && (
            <span className="chat-list__time shrink-0">
              {formatTime(conv.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="chat-list__preview flex-1">
            {conv.lastMessage?.content
              || (conv.lastMessage?.type === 'audio' ? '🎤 Voice message'
                : conv.lastMessage?.type === 'image' ? '📷 Photo'
                : conv.lastMessage?.type === 'video' ? '🎥 Video'
                : conv.lastMessage?.type === 'file' ? '📎 File'
                : 'No messages')}
          </p>
          {conv.unreadCount > 0 && (
            <span className="chat-list__unread">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

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

export default function ChatSidebar({
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
}) {
  const { t } = useTranslation();

  const filteredConversations = conversations.filter(c =>
    c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const status = socketConnected ? STATUS_LABEL.connected : STATUS_LABEL.offline;

  return (
    <>
      <aside className="w-80 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] shrink-0 space-y-3">
          <div className="flex items-center gap-2">
            <Input
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
              ) : null}
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

          <div className="flex items-center gap-2 text-xs px-1">
            <span
              className={`w-2 h-2 rounded-full ${status.dot} ${socketConnected ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            />
            <span className="text-[var(--color-text-muted)] font-medium">
              {socketConnected
                ? t('messaging.chat.connected', 'Connected')
                : t('messaging.chat.offlineMode', 'Offline mode')}
            </span>
          </div>
        </div>

        <ScrollShadow className="flex-1 min-h-0">
          {filteredConversations.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              size="md"
              title={t('pages.noConversations')}
              description={t('pages.startANewChatToBeginMessaging')}
            />
          ) : (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conv) => (
                <ConversationListItem
                  key={conv.id}
                  conv={conv}
                  isActive={selectedConversation?.id === conv.id}
                  onSelect={onSelectConversation}
                />
              ))}
            </div>
          )}
        </ScrollShadow>
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
}
