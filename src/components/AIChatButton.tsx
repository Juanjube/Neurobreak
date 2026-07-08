
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { chatMessageSchema, firstValidationError } from '../utils/validation';

interface AIChatButtonProps {
  t: (key: any) => string;
  lang: string;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const AIChatButton: React.FC<AIChatButtonProps> = ({ t, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: lang === 'es' ? 'Hola, soy tu asistente NeuroBreak. ¿En qué puedo ayudarte hoy?' : 'Hi, I\'m your NeuroBreak assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    const parsed = chatMessageSchema.safeParse(input);
    if (!parsed.success || loading) {
      if (!parsed.success) {
        setMessages(prev => [...prev, { role: 'ai', content: firstValidationError(parsed.error) }]);
      }
      return;
    }

    const userMsg = parsed.data;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.chat(userMsg, lang);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: lang === 'es' ? 'Error de conexión.' : 'Connection error.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-80 md:w-96 bg-card-dark border border-[#233648] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-primary/10 p-4 border-b border-[#233648] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="text-content font-bold text-sm">Neuro Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[#92adc9] hover:text-content transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-dark/50 min-h-[300px]">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-content rounded-br-none' 
                      : 'bg-[#233648] text-[#92adc9] rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#233648] text-[#92adc9] p-3 rounded-2xl rounded-bl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-card-dark border-t border-[#233648]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={lang === 'es' ? "Pregunta algo..." : "Ask something..."}
                maxLength={1000}
                className="flex-1 bg-[#233648] border-none rounded-xl text-content placeholder:text-content/20 px-4 text-sm focus:ring-1 focus:ring-primary"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-content p-2 rounded-xl flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-primary hover:bg-primary/90 text-content p-4 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
      >
        <span className={`material-symbols-outlined text-2xl transition-transform duration-300 ${isOpen ? 'rotate-90 scale-0 absolute' : 'scale-100'}`}>
          chat_bubble
        </span>
        <span className={`material-symbols-outlined text-2xl transition-transform duration-300 ${!isOpen ? '-rotate-90 scale-0 absolute' : 'scale-100'}`}>
          close
        </span>
      </button>
    </div>
  );
};

export default AIChatButton;
