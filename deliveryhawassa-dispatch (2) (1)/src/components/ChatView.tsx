import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Smartphone, Search, MoreVertical, Phone, Info, Check, CheckCheck, Plus } from 'lucide-react';
import { Driver } from '../types';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'dispatcher' | 'driver';
  text: string;
  timestamp: number;
}

interface ChatViewProps {
  drivers: Driver[];
  messages: Record<string, Message[]>;
  onSendMessage: (driverId: string, text: string) => void;
}

export default function ChatView({ drivers, messages, onSendMessage }: ChatViewProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedDriverId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedDriverId) return;
    onSendMessage(selectedDriverId, inputText);
    setInputText('');
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.phone.includes(searchTerm)
  );

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const currentMessages = selectedDriverId ? messages[selectedDriverId] || [] : [];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 font-sans">
      {/* Sidebar - Driver List */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredDrivers.map(driver => {
            const lastMsg = messages[driver.id]?.[messages[driver.id].length - 1];
            return (
              <button
                key={driver.id}
                onClick={() => setSelectedDriverId(driver.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                  selectedDriverId === driver.id ? 'bg-teal-50/50 border-l-4 border-l-teal-600' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {driver.name.charAt(0)}
                  </div>
                  {driver.isAvailable && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-slate-900 truncate">{driver.name}</p>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {lastMsg ? lastMsg.text : 'Start a conversation'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] relative">
        {selectedDriver ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {selectedDriver.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedDriver.name}</h3>
                  <p className="text-xs text-green-600 font-medium">
                    {selectedDriver.isAvailable ? 'Online' : 'On Delivery'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <button className="hover:text-teal-600 transition-colors"><Phone size={20} /></button>
                <button className="hover:text-teal-600 transition-colors"><Info size={20} /></button>
                <button className="hover:text-teal-600 transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-center mb-8">
                <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                  Today
                </span>
              </div>

              {currentMessages.map((msg, idx) => {
                const isMe = msg.senderRole === 'dispatcher';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative group ${
                      isMe ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-teal-100' : 'text-slate-400'}`}>
                        <span className="text-[9px]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
                <button type="button" className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
                  <Plus size={24} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-100 border-transparent rounded-2xl py-3 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 text-white p-3 rounded-full shadow-lg shadow-teal-900/20 transition-all active:scale-95"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
              <MessageSquare size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Select a driver</h3>
              <p className="text-sm">Choose a driver from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
