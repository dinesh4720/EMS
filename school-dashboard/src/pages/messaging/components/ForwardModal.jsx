import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox, Avatar } from '@heroui/react';
import { Search, Send, Users } from 'lucide-react';

export default function ForwardModal({ isOpen, onClose, onForward, conversations = [] }) {
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    if (conv.type === 'direct') {
      return conv.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const handleToggleConversation = (conversationId) => {
    setSelectedConversations(prev => {
      if (prev.includes(conversationId)) {
        return prev.filter(id => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  const handleForward = () => {
    onForward(selectedConversations);
    onClose();
    setSelectedConversations([]);
    setSearchQuery('');
  };

  const handleCancel = () => {
    onClose();
    setSelectedConversations([]);
    setSearchQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} placement="center" size="md">
      <ModalContent className="rounded-2xl">
        <ModalHeader className="flex flex-col gap-1 pt-6 pb-2 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <Send size={20} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Forward Message</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select conversations to forward to</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="px-6 pb-4">
          {/* Search */}
          <div className="mb-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversations.includes(conv.id);
                return (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 ring-1 ring-indigo-300 dark:ring-indigo-500/40'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                    onClick={() => handleToggleConversation(conv.id)}
                  >
                    <Checkbox size="sm"
                      isSelected={isSelected}
                      onValueChange={() => handleToggleConversation(conv.id)}
                      classNames={{
                        wrapper: isSelected ? 'bg-indigo-500 border-indigo-500' : '',
                      }}
                    />
                    <Avatar
                      src={conv.type === 'direct' ? conv.otherParticipant?.avatar : undefined}
                      name={conv.type === 'direct' ? conv.otherParticipant?.name : conv.groupName?.[0]}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conv.type === 'direct'
                          ? conv.otherParticipant?.name
                          : conv.groupName}
                      </p>
                      {conv.type === 'group' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {conv.participants?.length || 0} members
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ModalBody>
        <ModalFooter className="px-6 pb-6 pt-2">
          <Button
            variant="light"
            onClick={handleCancel}
            className="text-gray-600 dark:text-gray-400"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleForward}
            isDisabled={selectedConversations.length === 0}
            className="bg-indigo-500 hover:bg-indigo-600 font-medium px-6"
            startContent={selectedConversations.length > 0 ? <Send size={16} /> : null}
          >
            {selectedConversations.length === 0
              ? 'Select chats'
              : `Forward to ${selectedConversations.length} ${selectedConversations.length === 1 ? 'chat' : 'chats'}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
