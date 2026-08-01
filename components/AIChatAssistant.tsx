"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minimize2, Maximize2, Send, Sparkles, UserCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  escalated?: boolean;
  suggestedActions?: string[];
}

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your DealFlow AI Assistant. How can I help with your account status, campaign performance, or next steps today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          conversationHistory: messages.map((m) => ({ sender: m.role, text: m.content })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply,
            timestamp: new Date(),
            escalated: data.escalated,
            suggestedActions: data.suggestedActions,
          },
        ]);
      } else {
        throw new Error(data.error || "Failed to respond");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm having a little trouble connecting right now, but your assigned revenue agent has been notified and will assist you shortly!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-cyan-500/30 z-50 transition-all transform hover:scale-105"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-8 right-8 z-50 ${isMinimized ? "w-72" : "w-96"}`}
          >
            <Card className="border border-slate-800 bg-slate-950/95 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.7)] rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-900/80 border-b border-slate-800 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-white">DealFlow AI Assistant</p>
                    <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Kimi LLM Powered
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => setIsMinimized(!isMinimized)}>
                    {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-4 space-y-4">
                  <ScrollArea className="h-80 pr-3">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                              message.role === "user"
                                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none"
                                : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                            }`}
                          >
                            <p>{message.content}</p>
                            {message.escalated && (
                              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                                <UserCheck className="h-3 w-3" /> Escalated to Assigned Revenue Agent
                              </div>
                            )}
                            <p className="text-[9px] opacity-60 mt-1 text-right font-mono">
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" /> Thinking...
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Ask in simple English..."
                      className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-xs focus-visible:ring-cyan-500 h-9 rounded-xl"
                    />
                    <Button onClick={handleSendMessage} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white h-9 px-3 rounded-xl">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
