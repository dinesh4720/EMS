import { useState } from "react";
import { Card, CardBody, Input, Button, Avatar, ScrollShadow } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical } from "lucide-react";

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
    <div className="flex gap-3 max-h-[calc(100vh-16rem)] w-full">
      {/* Contacts List */}
      <Card className="w-80 shrink-0 shadow-sm border border-default-200">
        <CardBody className="p-0 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-default-100 shrink-0">
            <Input
              size="sm"
              placeholder="Search conversations..."
              startContent={<Search size={16} className="text-default-400" />}
              value={searchQuery}
              onValueChange={setSearchQuery}
              classNames={{ inputWrapper: "bg-default-100" }}
            />
          </div>
          <ScrollShadow className="flex-1 min-h-0">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-default-100 transition-colors ${selectedContact?.id === contact.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
              >
                <div className="relative">
                  <Avatar src={contact.avatar} size="sm" />
                  {contact.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{contact.name}</span>
                    <span className="text-[10px] text-default-400">{contact.time}</span>
                  </div>
                  <p className="text-xs text-default-400 truncate">{contact.lastMessage}</p>
                </div>
              </div>
            ))}
          </ScrollShadow>
        </CardBody>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 shadow-sm border border-default-200">
        <CardBody className="p-0 flex flex-col h-full overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-3 border-b border-default-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar src={selectedContact?.avatar} size="sm" />
                {selectedContact?.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />}
              </div>
              <div>
                <p className="text-sm font-medium">{selectedContact?.name}</p>
                <p className="text-xs text-default-400">{selectedContact?.online ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button isIconOnly size="sm" variant="light" title="Voice Call"><Phone size={16} /></Button>
              <Button isIconOnly size="sm" variant="light" title="Video Call"><Video size={16} /></Button>
              <Button isIconOnly size="sm" variant="light" title="More Options"><MoreVertical size={16} /></Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollShadow className="flex-1 min-h-0 p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-2xl ${msg.sender === "me" ? "bg-primary text-white rounded-br-sm" : "bg-default-100 rounded-bl-sm"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-white/70" : "text-default-400"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </ScrollShadow>

          {/* Input */}
          <div className="p-3 border-t border-default-100 shrink-0">
            <div className="flex gap-2">
              <Input
                size="sm"
                placeholder="Type a message..."
                value={newMessage}
                onValueChange={setNewMessage}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              <Button color="primary" size="sm" isIconOnly onPress={handleSend} title="Send Message">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
