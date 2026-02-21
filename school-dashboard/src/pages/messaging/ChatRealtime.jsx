import { useState, useEffect, useRef, useContext } from "react";
import { Avatar, ScrollShadow, Spinner } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X, Paperclip, Image as ImageIcon } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import socketService from "../../services/socketServiceEnhanced";
import chatService from "../../services/chatService";

export default function ChatRealtime() {
  const { user } = useContext(AppContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
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

    // Connect socket
    socketService.connect(user.id, 'staff');

    // Socket event listeners
    socketService.on('authenticated', () => {
      console.log('Socket authenticated');
      loadConversations();
    });

    socketService.on('new_message', (data) => {
      handleNewMessage(data.message);
    });

    socketService.on('message_notification', (data) => {
      // Update conversation list with new message
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
      // Update conversation list to reflect status
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
      // Update message status
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'read', readAt: data.readAt } : msg
      ));
    });

    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations(user.id, 'staff');
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId) => {
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
      
      // Join conversation room
      socketService.joinConversation(conversationId);
      
      // Mark messages as read
      socketService.markAsRead(null, conversationId);
      
      // Scroll to bottom
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
      
      // Mark as read if conversation is open
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
      // Send via socket
      socketService.sendMessage({
        conversationId: selectedConversation.id,
        receiverId: selectedConversation.otherParticipant.userId,
        receiverModel: selectedConversation.otherParticipant.userType === 'staff' ? 'Staff' : 'Student',
        content: messageContent,
        type: 'text'
      });

      // Stop typing indicator
      socketService.sendTyping(selectedConversation.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedConversation) return;

    // Send typing indicator
    socketService.sendTyping(selectedConversation.id, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
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

  return (
    <div className="flex gap-0 h-full w-full">
      {/* Conversations List */}
      <div className="w-80 shrink-0 border-r border-default-200 bg-background h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-default-200 shrink-0">
          <div className="flex items-center gap-2 w-full px-4 py-2.5 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
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
        </div>
        
        <ScrollShadow className="flex-1 min-h-0">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-default-400">
              No conversations yet
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
                  {selectedConversation.otherParticipant?.online 
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
            <p className="text-xl text-default-400">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
