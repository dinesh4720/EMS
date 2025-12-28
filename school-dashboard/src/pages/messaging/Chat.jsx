import { useState } from "react";
import { Avatar, ScrollShadow } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X } from "lucide-react";

const contacts = [
  { id: 1, name: "Rajesh Kumar", role: "Math Teacher", avatar: "https://i.pravatar.cc/150?u=1", online: true, lastMessage: "Sure, I'll send the report", time: "2m" },
  { id: 2, name: "Priya Singh", role: "English Teacher", avatar: "https://i.pravatar.cc/150?u=2", online: true, lastMessage: "The meeting is confirmed", time: "15m" },
  { id: 3, name: "Mr. Sharma", role: "Parent - Rahul", avatar: "https://i.pravatar.cc/150?u=3", online: false, lastMessage: "Thank you for the update", time: "1h" },
  { id: 4, name: "Amit Verma", role: "Admin", avatar: "https://i.pravatar.cc/150?u=4", online: true, lastMessage: "Documents are ready", time: "2h" },
  { id: 5, name: "Mrs. Patel", role: "Parent - Priya", avatar: "https://i.pravatar.cc/150?u=5", online: false, lastMessage: "When is the PTM?", time: "1d" },
];

const initialMessages = [
  { id: 1, sender: "them", text: "Good morning! I wanted to discuss Rahul's progress.", time: "10:30 AM" },
  { id: 2, sender: "me", text: "Good morning Mr. Sharma! Of course, I'd be happy to discuss.", time: "10:32 AM" },
  { id: 3, sender: "them", text: "How is he doing in Mathematics?", time: "10:33 AM" },
  { id: 4, sender: "me", text: "Rahul has shown great improvement this semester. His test scores have increased by 15%.", time: "10:35 AM" },
  { id: 5, sender: "them", text: "That's wonderful to hear! Thank you for the update.", time: "10:36 AM" },
];

export default function Chat() {
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "me", text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setNewMessage("");
  };

  return (
    <div className="flex gap-0 h-full w-full">
      {/* Contacts List */}
      <div className="w-80 shrink-0 border-r border-default-200 bg-background h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-default-200 shrink-0">
          {/* Search Input */}
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
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-default-100 transition-colors border-l-2 ${
                selectedContact?.id === contact.id
                  ? "bg-primary-50 border-primary"
                  : "border-transparent"
              }`}
            >
              <div className="relative">
                <Avatar src={contact.avatar} size="md" />
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-medium text-default-900 truncate">
                    {contact.name}
                  </span>
                  <span className="text-xs text-default-400">{contact.time}</span>
                </div>
                <p className="text-sm text-default-500 truncate">{contact.lastMessage}</p>
              </div>
            </div>
          ))}
        </ScrollShadow>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-background h-full flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-5 border-b border-default-200 shrink-0 bg-default-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={selectedContact?.avatar} size="md" />
              {selectedContact?.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="text-base font-medium text-default-900">{selectedContact?.name}</p>
              <p className="text-sm text-default-500">
                {selectedContact?.online ? "Online" : "Offline"}
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
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.sender === "me"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-default-100 text-default-900 rounded-bl-sm"
                }`}
              >
                <p className="text-base leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-1.5 ${
                    msg.sender === "me" ? "text-white/70" : "text-default-400"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </ScrollShadow>

        {/* Input - Always at bottom */}
        <div className="p-5 border-t border-default-200 shrink-0 bg-default-50/30">
          <div className="flex gap-3">
            <div className="flex items-center gap-2 flex-1 px-4 py-3 bg-white rounded-lg border border-default-200 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none text-base text-default-900 placeholder:text-default-400"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
            <button
              onClick={handleSend}
              className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-lg border border-primary hover:bg-primary-600 transition-all duration-200 cursor-pointer"
              title="Send Message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
