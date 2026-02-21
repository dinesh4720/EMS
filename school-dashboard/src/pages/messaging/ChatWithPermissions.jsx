import { useState, useEffect, useRef } from "react";
import { Avatar, ScrollShadow, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, Input } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X, Plus, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import socketService from "../../services/socketServiceEnhanced";
import chatService from "../../services/chatService";
import api from "../../services/api";

export default function ChatWithPermissions() {
  const { user } = useApp();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [permissions, setPermissions] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedConversationRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    console.log('🚀 Initializing chat for user:', user.id, user.role);

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Chat loading timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    // Load user permissions first
    loadPermissions();

    // Connect socket
    socketService.connect(user.id, 'staff');

    // Socket event listeners
    socketService.on('authenticated', () => {
      console.log('✅ Socket authenticated - loading conversations');
      loadConversations();
      clearTimeout(loadingTimeout);
    });

    socketService.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    socketService.on('new_message', (data) => {
      handleNewMessage(data.message);
    });

    socketService.on('message_notification', (data) => {
      loadConversations();
    });

    socketService.on('user_typing', (data) => {
      // Only show typing indicator for the currently open conversation
      const currentConversation = selectedConversationRef.current;
      if (data.conversationId === currentConversation?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }
    });

    socketService.on('user_status', (data) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
      setConversations(prev => prev.map(conv => {
        if (conv.otherParticipant?.userId === data.userId) {
          return {
            ...conv,
            otherParticipant: {
              ...conv.otherParticipant,
              online: data.status === 'online',
              lastSeen: data.lastSeen
            }
          };
        }
        return conv;
      }));
    });

    socketService.on('message_read', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'read', readAt: data.readAt } : msg
      ));
    });

    socketService.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.message?.includes('permission')) {
        alert(error.message);
      }
    });

    return () => {
      socketService.disconnect();
      console.log('🔌 Socket disconnected on cleanup');
    };
  }, [user?.id]);

  // Load user permissions
  const loadPermissions = async () => {
    try {
      console.log('🔐 Loading chat permissions for user:', user.id);
      const response = await api.get('/messages/permissions', {
        params: { userId: user.id, userType: 'staff' }
      });
      setPermissions(response.data);
      console.log('✅ User chat permissions loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      // Set default permissions on error to prevent infinite loading
      setPermissions({
        canSendMessage: true,
        canViewConversations: true,
        canMessageStaff: true,
        canMessageStudents: false,
        canMessageParents: false,
        canMessageAnyone: false
      });
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      console.log('💬 Loading conversations for user:', user.id);
      setLoading(true);
      const data = await chatService.getConversations(user.id, 'staff');
      console.log('✅ Conversations loaded:', data.length);
      setConversations(data);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      // Set empty array on error to prevent infinite loading
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load available contacts based on permissions
  const loadAvailableContacts = async () => {
    try {
      const contacts = [];

      // Load staff if user can message staff
      if (permissions?.canMessageStaff || permissions?.canMessageAnyone) {
        const staffResponse = await api.get('/staff');
        const staff = staffResponse.data
          .filter(s => s.id !== user.id) // Exclude self
          .map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            avatar: s.photo,
            type: 'staff'
          }));
        contacts.push(...staff);
      }

      // Load students if user can message students
      if (permissions?.canMessageStudents || permissions?.canMessageAnyone) {
        const studentsResponse = await api.get('/students');
        const students = studentsResponse.data.map(s => ({
          id: s.id,
          name: s.name,
          role: s.class || 'Student',
          avatar: s.photo,
          type: 'student'
        }));
        contacts.push(...students);
      }

      setAvailableContacts(contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Start new conversation
  const startNewConversation = async (contact) => {
    try {
      const conversation = await chatService.createConversation(
        user.id,
        'staff',
        contact.id,
        contact.type
      );
      
      setShowNewChatModal(false);
      setConversations(prev => [conversation, ...prev]);
      setSelectedConversation(conversation);
      loadMessages(conversation.id);
    } catch (error) {
      console.error('Error starting conversation:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId) => {
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
      socketService.joinConversation(conversationId);
      socketService.markAsRead(null, conversationId);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle new message from socket
  const handleNewMessage = (message) => {
    if (message.conversationId === selectedConversation?.id) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      socketService.markAsRead(message.id, message.conversationId);
    }
  };

  // Select conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      socketService.sendMessage({
        conversationId: selectedConversation.id,
        receiverId: selectedConversation.otherParticipant.userId,
        receiverModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageContent,
        type: 'text'
      });
      socketService.sendTyping(selectedConversation.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedConversation) return;

    socketService.sendTyping(selectedConversation.id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(selectedConversation.id, false);
    }, 2000);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherParticipant?.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter contacts
  const filteredContacts = availableContacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if user has permission to use chat
  if (permissions && !permissions.canSendMessage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Chat Access Restricted</h2>
          <p className="text-default-500 mb-4">
            You do not have permission to use the chat feature. Please contact your administrator to enable messaging permissions.
          </p>
          <div className="text-sm text-default-400">
            Your role: <strong>{user.role}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-0 h-full w-full">
        {/* Conversations List */}
        <div className="w-80 shrink-0 border-r border-default-200 bg-background h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-default-200 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                <Search size={18} className="text-default-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
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
                onPress={() => {
                  loadAvailableContacts();
                  setShowNewChatModal(true);
                }}
                title="New Chat"
              >
                <Plus size={20} />
              </Button>
            </div>
            
            {/* Permission indicator */}
            {permissions && (
              <div className="text-xs text-default-400 px-2">
                Can message: {
                  permissions.canMessageAnyone ? 'Anyone' :
                  [
                    permissions.canMessageStaff && 'Staff',
                    permissions.canMessageStudents && 'Students',
                    permissions.canMessageParents && 'Parents'
                  ].filter(Boolean).join(', ') || 'Limited'
                }
              </div>
            )}
          </div>
          
          <ScrollShadow className="flex-1 min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-default-400">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Click + to start a new chat</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-default-100 transition-colors border-l-2 ${
                    selectedConversation?.id === conversation.id
                      ? "bg-primary-50 border-primary"
                      : "border-transparent"
                  }`}
                >
                  <div className="relative">
                    <Avatar 
                      src={conversation.otherParticipant?.avatar} 
                      name={conversation.otherParticipant?.name}
                      size="md" 
                    />
                    {conversation.otherParticipant?.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-medium text-default-900 truncate">
                        {conversation.otherParticipant?.name}
                      </span>
                      {conversation.lastMessage?.timestamp && (
                        <span className="text-xs text-default-400">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-default-500 truncate flex-1">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollShadow>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 bg-background h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-5 border-b border-default-200 shrink-0 bg-default-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar 
                    src={selectedConversation.otherParticipant?.avatar}
                    name={selectedConversation.otherParticipant?.name}
                    size="md" 
                  />
                  {selectedConversation.otherParticipant?.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="text-base font-medium text-default-900">
                    {selectedConversation.otherParticipant?.name}
                  </p>
                  <p className="text-sm text-default-500">
                    {selectedConversation.otherParticipant?.role} • {selectedConversation.otherParticipant?.online 
                      ? "Online" 
                      : selectedConversation.otherParticipant?.lastSeen 
                        ? `Last seen ${formatTime(selectedConversation.otherParticipant.lastSeen)}`
                        : "Offline"
                    }
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
              {messages.map((msg) => {
                const isMe = String(msg.senderId) === String(user.id);
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
                      <p className="text-base leading-relaxed">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p
                          className={`text-xs ${
                            isMe ? "text-white/70" : "text-default-400"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                        {isMe && msg.status && (
                          <span className="text-xs text-white/70">
                            {msg.status === 'read' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-default-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
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
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Message"
                >
                  {sending ? <Spinner size="sm" color="white" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-default-50">
            <div className="text-center">
              <Users size={64} className="mx-auto mb-4 text-default-300" />
              <p className="text-xl text-default-400">Select a conversation to start messaging</p>
              <p className="text-sm text-default-300 mt-2">or click + to start a new chat</p>
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
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  No contacts available
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => startNewConversation(contact)}
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
