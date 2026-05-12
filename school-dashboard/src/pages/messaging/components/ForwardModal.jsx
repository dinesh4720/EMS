import { useState } from 'react';
import { Search, Send, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Checkbox,
  Avatar,
  Input,
  EmptyState,
} from '../../../components/ui';

export default function ForwardModal({ isOpen, onClose, onForward, conversations = [] }) {
  const { t } = useTranslation();
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    if (conv.type === 'direct') {
      return conv.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggle = (id) => {
    setSelectedConversations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setSelectedConversations([]);
    setSearchQuery('');
  };

  const handleForward = () => {
    onForward(selectedConversations);
    onClose();
    reset();
  };

  const handleCancel = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="md"
      title={t('pages.forwardMessage')}
      description={t('pages.selectConversationsToForwardTo')}
      footer={(
        <>
          <Button variant="ghost" onClick={handleCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            icon={selectedConversations.length > 0 ? <Send size={16} /> : null}
          >
            {selectedConversations.length === 0
              ? t('messaging.chat.selectChats', 'Select chats')
              : `${t('messaging.chat.forwardTo', 'Forward to')} ${selectedConversations.length} ${selectedConversations.length === 1 ? t('messaging.chat.chat', 'chat') : t('messaging.chat.chats', 'chats')}`}
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        <Input
          placeholder={t('pages.searchConversations')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search size={16} />}
          aria-label={t('pages.searchConversations')}
        />

        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filteredConversations.length === 0 ? (
            <EmptyState
              icon={Users}
              size="sm"
              title={t('pages.noConversationsFound')}
            />
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversations.includes(conv.id);
              return (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(conv.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                    isSelected
                      ? 'bg-accent-bg ring-1 ring-accent-border'
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggle(conv.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={conv.type === 'direct' ? conv.otherParticipant?.name : conv.groupName}
                  />
                  <Avatar
                    src={conv.type === 'direct' ? conv.otherParticipant?.avatar : undefined}
                    name={conv.type === 'direct' ? conv.otherParticipant?.name : conv.groupName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {conv.type === 'direct' ? conv.otherParticipant?.name : conv.groupName}
                    </p>
                    {conv.type === 'group' && (
                      <p className="text-xs text-fg-muted">
                        {conv.participants?.length || 0} {t('messaging.chat.members', 'members')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
