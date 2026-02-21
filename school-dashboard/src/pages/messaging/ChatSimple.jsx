import { useState, useEffect } from "react";
import { Avatar, ScrollShadow, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, Input } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X, Plus, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function ChatSimple() {
  const { user, staff, students } = useApp();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  // Load contacts from AppContext
  useEffect(() => {
    if (staff && students) {
      loadContacts();
    }
  }, [staff, students]);

  const loadContacts = () => {
    try {
      setLoading(true);
      console.log('📋 Loading contacts from AppContext...');
      
      // Format staff
      const staffContacts = staff
        .filter(s => s.id !== user?.id) // Exclude self
        .map(s => ({
          id: s.id,
          name: s.name,
          role: s.role,
          avatar: s.photo,
          type: 'staff',
          online: false,
          lastMessage: '',
          time: ''
        }));

      // Format students
      const studentContacts = students.map(s => ({
        id: s.id,
        name: s.name,
        role: s.class || 'Student',
        avatar: s.photo,
        type: 'student',
        online: false,
        lastMessage: '',
        time: ''
      }));

      const allContacts = [...staffContacts, ...studentContacts];
      console.log('✅ Loaded contacts:', allContacts.length);
      setContacts(allContacts);
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    // In a real implementation, load messages from backend
    setMessages([
      {
        id: 1,
        senderId: contact.id,
        text: `Hello! This is a demo message from ${contact.name}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedContact || !user?.id) return;

    const newMsg = {
      id: Date.now(),
      senderId: user.id,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");

    // Update contact's last message
    setContacts(contacts.map(c =>
      c.id === selectedContact.id
        ? { ...c, lastMessage: newMessage, time: 'Just now' }
        : c
    ));
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModalContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-0 h-full w-full">
        {/* Contacts List */}
        <div className="w-80 shrink-0 border-r border-default-200 bg-background h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-default-200 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                <Search size={18} className="text-default-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="flex-1 bg-transparent outline-none text-base text-default-900 placeholder:text-default-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 hover:bg-default-200 rounded cursor-pointer"
                  >
                    <X size={16} className="text-default-400" />
                  </button>
                )}
              </div>
              <Button
                isIconOnly
                color="primary"
                variant="flat"
                onPress={() => setShowNewChatModal(true)}
                title="New Chat"
              >
                <Plus size={20} />
              </Button>
            </div>
            
            <div className="text-xs text-default-400 px-2">
              {contacts.length} contacts available
            </div>
          </div>
          
          <ScrollShadow className="flex-1 min-h-0">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-default-400">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No contacts found</p>
                <p className="text-xs mt-1">Try a different search</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-default-100 transition-colors border-l-2 ${
                    selectedContact?.id === contact.id
                      ? "bg-primary-50 border-primary"
                      : "border-transparent"
                  }`}
                >
                  <div className="relative">
                    <Avatar 
                      src={contact.avatar} 
                      name={contact.name}
                      size="md" 
                    />
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-medium text-default-900 truncate">
                        {contact.name}
                      </span>
                      {contact.time && (
                        <span className="text-xs text-default-400">{contact.time}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-default-500 truncate flex-1">
                        {contact.lastMessage || contact.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollShadow>
        </div>

        {/* Chat Area */}
        {selectedContact ? (
          <div className="flex-1 bg-background h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-5 border-b border-default-200 shrink-0 bg-default-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar 
                    src={selectedContact.avatar}
                    name={selectedContact.name}
                    size="md" 
                  />
                  {selectedContact.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="text-base font-medium text-default-900">
                    {selectedContact.name}
                  </p>
                  <p className="text-sm text-default-500">
                    {selectedContact.role} • {selectedContact.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2.5 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary"
                  title="Voice Call"
                >
                  <Phone size={18} />
                </button>
                <button
                  className="p-2.5 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary"
                  title="Video Call"
                >
                  <Video size={18} />
                </button>
                <button
                  className="p-2.5 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary"
                  title="More Options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollShadow className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-default-400">
                  <div className="text-center">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = String(msg.senderId) === String(user?.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                          isMe
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-default-100 text-default-900 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-base leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-xs mt-1.5 ${
                            isMe ? "text-white/70" : "text-default-400"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollShadow>

            {/* Input */}
            <div className="p-5 border-t border-default-200 shrink-0 bg-default-50/30">
              <div className="flex gap-3">
                <div className="flex items-center gap-2 flex-1 px-4 py-3 bg-white rounded-lg border border-default-200 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent outline-none text-base text-default-900 placeholder:text-default-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-default-50">
            <div className="text-center">
              <Users size={64} className="mx-auto mb-4 text-default-300" />
              <p className="text-xl text-default-400">Select a contact to start messaging</p>
              <p className="text-sm text-default-300 mt-2">or click + to search contacts</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal 
        isOpen={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Start New Conversation</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              startContent={<Search size={18} />}
              className="mb-4"
            />
            <ScrollShadow className="max-h-96">
              {filteredModalContacts.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  No contacts found
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {filteredModalContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        handleSelectContact(contact);
                        setShowNewChatModal(false);
                        setContactSearch("");
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-default-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <Avatar 
                        src={contact.avatar}
                        name={contact.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-default-500">{contact.role}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-default-200 rounded">
                        {contact.type}
                      </span>
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
