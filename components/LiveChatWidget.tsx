"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Send, X, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "agent" | "user";
  timestamp: string;
}

export function LiveChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      text: "👋 Hi there! I'm the DealFlow AI Assistant. How can I help accelerate your pipeline today?",
      sender: "agent",
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for open event from header
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    };
    window.addEventListener("open-live-chat", handleOpen);
    return () => window.removeEventListener("open-live-chat", handleOpen);
  }, []);

  // Listen for escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Simulate Agent Reply
    setTimeout(() => {
      const agentReply: Message = {
        id: `agent-${Date.now()}`,
        text: "Thanks for reaching out! A RevOps agent has been alerted and will join shortly. In the meantime, feel free to run a free GTM analysis on our homepage.",
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentReply]);
    }, 1200);
  };

  // Completely hide in Admin and Agent portals
  if (pathname?.startsWith("/portal/admin") || pathname?.startsWith("/portal/agent")) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[480px] rounded-3xl border border-white/10 dark:border-white/15 bg-white dark:bg-[#070718] shadow-2xl flex flex-col overflow-hidden z-[999] shadow-black/40"
          role="dialog"
          aria-label="Live Chat Support"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 text-white shadow-md shadow-violet-500/20">
                <Bot className="h-5.5 w-5.5" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070718]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-none">DealFlow Support</h3>
                <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  Agent Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Close live chat"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-transparent">
            {messages.map((msg) => {
              const isAgent = msg.sender === "agent";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isAgent ? "self-start" : "ml-auto flex-row-reverse"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs border ${
                      isAgent
                        ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
                        : "bg-violet-600 border-violet-500 text-white"
                    }`}
                  >
                    {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`text-xs px-4 py-2.5 rounded-2xl leading-relaxed ${
                        isAgent
                          ? "bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm"
                          : "bg-violet-600 text-white rounded-tr-sm shadow-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div
                      className={`text-[9px] text-slate-400 px-1 ${
                        isAgent ? "text-left" : "text-right"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-[#070718]"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50 disabled:hover:bg-violet-600 shadow-md shadow-violet-500/20"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
