import { AiPanelProvider, AiDockablePanel, AiPanelHeader, AiPanelBody, AiPanelFooter, useAiPanel } from './components/AiDockablePanel';
import AiPanelLayout from './components/AiPanelLayout';
import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

// ============================================
// EXAMPLE 1: Complete Working Implementation
// ============================================

export default function AiPanelExample() {
  return (
    <AiPanelProvider>
      <AppWithAiPanel />
    </AiPanelProvider>
  );
}

function AppWithAiPanel() {
  const { isOpen, togglePanel } = useAiPanel();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r">
        {/* Your sidebar content */}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar with AI Toggle Button */}
        <header className="h-12 border-b flex items-center justify-between px-4">
          <h1>Dashboard</h1>
          <button
            onClick={togglePanel}
            className="p-2 rounded-full hover:bg-default-100 transition-colors"
            title="Toggle AI Assistant (⌘K)"
          >
            <Sparkles className={`w-5 h-5 ${isOpen ? 'text-primary' : 'text-default-500'}`} />
          </button>
        </header>

        {/* Content with Layout Wrapper */}
        <AiPanelLayout>
          <main className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">Main Content</h2>
              <p>
                This content will automatically resize when the AI panel opens.
                The layout uses smooth CSS transitions for a native feel.
              </p>
              
              {/* Example content that demonstrates resizing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card">
                    <h3 className="font-semibold mb-2">Card {i}</h3>
                    <p className="text-sm text-muted-foreground">
                      Content that adjusts to panel state
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </AiPanelLayout>
      </div>

      {/* AI Panel */}
      <AiDockablePanel>
        <SimpleAiPanelContent />
      </AiDockablePanel>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Simple AI Panel Content
// ============================================

function SimpleAiPanelContent() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I received your message: "${userMessage.content}"`
      }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      <AiPanelHeader 
        title="AI Assistant"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Online
            </span>
          </div>
        }
      />
      
      <AiPanelBody>
        <div className="p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-none p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </AiPanelBody>
      
      <AiPanelFooter>
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              className="w-full px-3 py-2 pr-10 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </AiPanelFooter>
    </>
  );
}

// ============================================
// EXAMPLE 3: Custom Panel Width Control
// ============================================

export function WidthControlExample() {
  const { panelWidth, setPanelWidth, isOpen } = useAiPanel();

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-background border rounded-lg p-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Panel Width:</span>
        <input
          type="range"
          min="320"
          max="800"
          step="40"
          value={panelWidth}
          onChange={(e) => setPanelWidth(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground w-12">{panelWidth}px</span>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Keyboard Shortcuts Display
// ============================================

export function KeyboardShortcuts() {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-2">
      <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-background border rounded">⌘K</kbd>
          <span>Toggle panel</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-background border rounded">Esc</kbd>
          <span>Close panel</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-background border rounded">Enter</kbd>
          <span>Send message</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Panel State Indicator
// ============================================

export function PanelStateIndicator() {
  const { isOpen, isMinimized, isDocked } = useAiPanel();

  const getStateText = () => {
    if (!isOpen) return 'Closed';
    if (isMinimized) return 'Minimized';
    if (isDocked) return 'Docked';
    return 'Floating';
  };

  const getStateColor = () => {
    if (!isOpen) return 'bg-gray-500';
    if (isMinimized) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStateColor()}`} />
      <span className="text-xs text-muted-foreground">{getStateText()}</span>
    </div>
  );
}

// ============================================
// EXAMPLE 6: Responsive Layout Demo
// ============================================

export function ResponsiveLayoutDemo() {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
      <h3 className="font-semibold text-sm">Responsive Behavior</h3>
      <div className="text-xs space-y-1">
        <p>🖥️ <strong>Desktop (≥1024px):</strong> Panel docks, content resizes</p>
        <p>📱 <strong>Tablet (768-1023px):</strong> Panel overlays (80% width)</p>
        <p>📱 <strong>Mobile (<768px):</strong> Full-screen overlay</p>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Resize your browser to see the panel behavior change
      </p>
    </div>
  );
}
