import { useState } from "react";
import { Send, Search, Phone, Video, MoreVertical, X, Plus } from "lucide-react";

const contacts = [
  { id: 1, name: "Rajesh Kumar", role: "Math Teacher", avatar: "https://i.pravatar.cc/150?u=1", online: true, lastMessage: "Sure, I'll send the report", time: "2m", unread: 0 },
  { id: 2, name: "Priya Singh", role: "English Teacher", avatar: "https://i.pravatar.cc/150?u=2", online: true, lastMessage: "The meeting is confirmed", time: "15m", unread: 2 },
  { id: 3, name: "Mr. Sharma", role: "Parent - Rahul", avatar: "https://i.pravatar.cc/150?u=3", online: false, lastMessage: "Thank you for the update", time: "1h", unread: 0 },
  { id: 4, name: "Amit Verma", role: "Admin", avatar: "https://i.pravatar.cc/150?u=4", online: true, lastMessage: "Documents are ready", time: "2h", unread: 0 },
  { id: 5, name: "Mrs. Patel", role: "Parent - Priya", avatar: "https://i.pravatar.cc/150?u=5", online: false, lastMessage: "When is the PTM?", time: "1d", unread: 1 },
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
    setMessages([...messages, {
      id: Date.now(),
      sender: "me",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage("");
  };

  return (
    <div className="flex h-full w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Contacts List */}
      <div className="w-72 shrink-0 border-r border-gray-200 h-full flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-colors">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-200 rounded">
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
            <button className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContact?.id === contact.id;
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-2 ${
                  isSelected
                    ? "bg-teal-50 border-teal-600"
                    : "hover:bg-gray-50 border-transparent"
                }`}
              >
                <div className="relative shrink-0">
                  <img src={contact.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {contact.name}
                    </span>
                    <span className="text-xs text-gray-400">{contact.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-teal-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={selectedContact?.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  {selectedContact?.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedContact?.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedContact?.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg ${
                        isMe
                          ? "bg-teal-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                </div>
                <button
                  onClick={handleSend}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-sm text-gray-500">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
