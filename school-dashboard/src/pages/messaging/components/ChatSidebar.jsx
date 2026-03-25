import { Avatar, ScrollShadow, Button, Modal, ModalContent, ModalHeader, ModalBody, Input, Chip, Tooltip } from "@heroui/react";
import { Search, X, Plus, Users, MessageCircle } from "lucide-react";
import { formatTime } from "../utils/chatUtils";
import { useTranslation } from 'react-i18next';

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

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <>
      <div className="w-80 shrink-0 border-r border-default-200 dark:border-zinc-800 bg-background h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-default-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-default-50 dark:bg-zinc-900 rounded-xl border border-default-200 dark:border-zinc-800 focus-within:border-primary dark:focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
              <Search size={18} className="text-default-400 dark:text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder={t('pages.searchConversations')}
                className="flex-1 bg-transparent outline-none text-sm text-default-900 dark:text-zinc-100 placeholder:text-default-500 dark:placeholder:text-zinc-600"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="text-default-400 hover:text-default-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* New Chat Button */}
            <Tooltip content="New conversation" placement="top">
              <Button
                isIconOnly
                color="primary"
                variant="solid"
                onPress={onOpenNewChatModal}
                className="rounded-xl bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              >
                <Plus size={20} />
              </Button>
            </Tooltip>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs px-1">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success' : 'bg-warning'} ${socketConnected ? 'animate-pulse' : ''}`} />
            <span className="text-default-500 dark:text-zinc-500 font-medium">
              {socketConnected ? 'Connected' : 'Offline mode'}
            </span>
          </div>
        </div>

        <ScrollShadow className="flex-1 min-h-0">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-default-400 dark:text-zinc-600">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-default-100 dark:bg-zinc-900 flex items-center justify-center">
                <Users size={28} className="text-default-300 dark:text-zinc-700" />
              </div>
              <p className="font-medium text-default-500 dark:text-zinc-500">{t('pages.noConversations')}</p>
              <p className="text-sm mt-1">{t('pages.startANewChatToBeginMessaging')}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all duration-200 border-l-[3px] group ${selectedConversation?.id === conv.id
                      ? "bg-primary-50 dark:bg-primary/10 border-primary"
                      : "border-transparent hover:bg-default-50 dark:hover:bg-zinc-900 hover:border-default-300 dark:hover:border-zinc-700"
                    }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={conv.otherParticipant?.avatar}
                      name={conv.otherParticipant?.name}
                      size="md"
                      className="ring-2 ring-transparent group-hover:ring-default-200 dark:group-hover:ring-zinc-700 transition-all duration-200"
                    />
                    {conv.otherParticipant?.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-lg shadow-success/30">
                        <span className="absolute inset-0 rounded-full bg-success-500 animate-ping opacity-75" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${selectedConversation?.id === conv.id ? 'font-semibold text-primary' : 'font-medium text-default-900 dark:text-zinc-100 group-hover:text-default-900 dark:group-hover:text-zinc-100'}`}>
                        {conv.otherParticipant?.name}
                      </span>
                      {conv.lastMessage?.timestamp && (
                        <span className="text-[11px] text-default-400 dark:text-zinc-600 font-medium">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-default-500 dark:text-zinc-500 truncate flex-1">
                        {conv.lastMessage?.content || (conv.lastMessage?.type === 'audio' ? '🎤 Voice message' : conv.lastMessage?.type === 'image' ? '📷 Photo' : conv.lastMessage?.type === 'video' ? '🎥 Video' : conv.lastMessage?.type === 'file' ? '📎 File' : 'No messages')}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Chip size="sm" color="primary" variant="solid" className="ml-2 min-w-5 h-5 text-[10px] font-bold shadow-sm shadow-primary/30">
                          {conv.unreadCount}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollShadow>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChatModal}
        onClose={onCloseNewChatModal}
        size="2xl"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0"
        }}
      >
        <ModalContent className="overflow-hidden">
          <ModalHeader className="border-b border-default-200 dark:border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <MessageCircle size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-default-900 dark:text-zinc-100">{t('pages.startNewConversation2')}</h3>
                <p className="text-xs text-default-500 dark:text-zinc-500">{t('pages.selectAContactToBeginMessaging')}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-4">
            <Input
              placeholder={t('pages.searchContactsByNameOrRole')}
              value={contactSearch}
              onChange={(e) => onContactSearchChange(e.target.value)}
              startContent={<Search size={18} className="text-default-400" />}
              classNames={{
                input: "text-sm",
                inputWrapper: "rounded-xl border-default-200 dark:border-zinc-700"
              }}
              variant="bordered"
              className="mb-4"
            />
            <ScrollShadow className="max-h-96">
              {filteredContacts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-default-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Users size={20} className="text-default-400 dark:text-zinc-600" />
                  </div>
                  <p className="text-default-500 dark:text-zinc-500 text-sm">{t('pages.noContactsFound')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => onStartNewConversation(contact)}
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-primary/30"
                    >
                      <Avatar
                        src={contact.avatar}
                        name={contact.name}
                        size="md"
                        className="ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-default-900 dark:text-zinc-100 group-hover:text-primary transition-colors">{contact.name}</p>
                        <p className="text-xs text-default-500 dark:text-zinc-500">{contact.role}</p>
                      </div>
                      <Chip size="sm" variant="flat" className="capitalize bg-default-100 dark:bg-zinc-800 text-default-600 dark:text-zinc-400">
                        {contact.type}
                      </Chip>
                    </div>
                  ))}
                </div>
              )}
            </ScrollShadow>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
