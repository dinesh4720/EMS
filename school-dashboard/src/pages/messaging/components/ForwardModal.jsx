import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox } from '@heroui/react';
import { Search } from 'lucide-react';

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
    <Modal isOpen={isOpen} onClose={handleCancel} placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Forward Message</h3>
          <p className="text-sm text-default-500">Select conversations to forward this message to</p>
        </ModalHeader>
        <ModalBody>
          {/* Search */}
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-default-100 rounded-lg">
              <Search size={18} className="text-default-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-default-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredConversations.length === 0 ? (
              <p className="text-center text-default-500 py-8">No conversations found</p>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversations.includes(conv.id)
                      ? 'bg-primary-10 border border-primary'
                      : 'hover:bg-default-50 border border-transparent'
                  }`}
                  onClick={() => handleToggleConversation(conv.id)}
                >
                  <Checkbox
                    isSelected={selectedConversations.includes(conv.id)}
                    onValueChange={() => handleToggleConversation(conv.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.type === 'direct'
                        ? conv.otherParticipant?.name
                        : conv.groupName}
                    </p>
                    {conv.type === 'group' && (
                      <p className="text-xs text-default-500">
                        {conv.participants?.length || 0} members
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleForward}
            isDisabled={selectedConversations.length === 0}
          >
            Forward to {selectedConversations.length} {selectedConversations.length === 1 ? 'chat' : 'chats'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
