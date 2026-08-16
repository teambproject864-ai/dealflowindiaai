"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, MessageSquare, Sparkles, X, Phone, Bot, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingWidget } from "@/components/BookingWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minimize2, Maximize2, Send, UserCheck, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  escalated?: boolean;
  suggestedActions?: string[];
}

export function FloatingActionHub() {
  const [activeWidget, setActiveWidget] = useState<"none" | "call" | "chat">("none");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your DealFlow AI Assistant. How can I assist with your pipeline growth, campaigns, or booking a strategy session today?",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global event listeners to open modals from any page / CTA button
  useEffect(() => {
    const handleOpenCall = () => {
      setActiveWidget("call");
      setIsExpanded(false);
    };
    const handleCloseCall = () => setActiveWidget("none");
    const handleOpenChat = () => {
      setActiveWidget("chat");
      setIsExpanded(false);
    };
    const handleCloseChat = () => setActiveWidget("none");

    window.addEventListener("open-voice-call", handleOpenCall);
    window.addEventListener("close-voice-call", handleCloseCall);
    window.addEventListener("open-ai-chat", handleOpenChat);
    window.addEventListener("open-live-chat", handleOpenChat);
    window.addEventListener("close-ai-chat", handleCloseChat);

    return () => {
      window.removeEventListener("open-voice-call", handleOpenCall);
      window.removeEventListener("close-voice-call", handleCloseCall);
      window.removeEventListener("open-ai-chat", handleOpenChat);
      window.removeEventListener("open-live-chat", handleOpenChat);
      window.removeEventListener("close-ai-chat", handleCloseChat);
    };
  }, []);

  // Keyboard shortcut (Escape to close any open widget)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeWidget !== "none") setActiveWidget("none");
        if (isExpanded) setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWidget, isExpanded]);

  useEffect(() => {
    if (activeWidget === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeWidget]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          conversationHistory: chatMessages.map((m) => ({ sender: m.role, text: m.content })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [
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
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Our revenue team has been alerted and will assist you shortly! You can also book a direct call using the Book a Call option.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const isModalOrDrawerOpen = activeWidget !== "none";

  return (
    <>
      {/* ─── 1. UNIFIED FLOATING ACTION HUB (Mutually Exclusive Rendering) ─── */}
      <AnimatePresence>
        {!isModalOrDrawerOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 select-none"
          >
            {/* Expanded Options Menu */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2 mb-1 p-2 rounded-2xl bg-slate-950/90 dark:bg-[#0c0c12]/95 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/60 min-w-[210px]"
                >
                  {/* Option 1: Book a Call */}
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setActiveWidget("call");
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-violet-600/20 text-slate-200 hover:text-white transition-all group text-left border border-transparent hover:border-violet-500/30"
                    aria-label="Open schedule a call calendar"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/30 group-hover:scale-105 transition-transform">
                      <Calendar className="w-4 h-4 text-violet-100" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight text-white">Book a Call</span>
                      <span className="text-[10px] text-violet-300/80">Direct SDR Strategy</span>
                    </div>
                  </button>

                  {/* Option 2: AI Chat Assistant */}
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setActiveWidget("chat");
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-cyan-600/20 text-slate-200 hover:text-white transition-all group text-left border border-transparent hover:border-cyan-500/30"
                    aria-label="Open AI chat assistant"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/30 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4 text-cyan-100" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight text-white">AI Assistant</span>
                      <span className="text-[10px] text-cyan-300/80">Instant Dealflow AI</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Action Dock Trigger */}
            <div className="flex items-center gap-2">
              {/* Desktop Quick Pill Buttons */}
              <div className="hidden sm:flex items-center gap-2 p-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/40">
                <button
                  onClick={() => setActiveWidget("call")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-600/30 hover:scale-[1.02]"
                  aria-label="Book a call"
                >
                  <Calendar className="w-3.5 h-3.5 text-violet-200" />
                  <span>Book a Call</span>
                </button>

                <button
                  onClick={() => setActiveWidget("chat")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/30 hover:scale-[1.02]"
                  aria-label="Chat with AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>AI Chat</span>
                </button>
              </div>

              {/* Mobile Single FAB Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="sm:hidden flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-2xl shadow-indigo-500/40 border border-white/20 relative"
                aria-label="Toggle quick actions hub"
              >
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-slate-950" />
                </span>
                {isExpanded ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. "BOOK A CALL" MODAL (Mutually Exclusive) ─── */}
      <AnimatePresence>
        {activeWidget === "call" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveWidget("none")} />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 25 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl z-10 custom-scrollbar"
            >
              {/* Close Button Header */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <button
                  onClick={() => setActiveWidget("none")}
                  className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close call scheduler"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Booking Widget Wrapper */}
              <div className="p-1">
                <BookingWidget
                  name=""
                  email=""
                  companyName=""
                  onClose={() => setActiveWidget("none")}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 3. "AI CHAT ASSISTANT" WINDOW (Mutually Exclusive) ─── */}
      <AnimatePresence>
        {activeWidget === "chat" && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={`fixed bottom-6 right-6 z-50 ${isChatMinimized ? "w-72" : "w-96 max-w-[calc(100vw-3rem)]"}`}
          >
            <Card className="border border-slate-800 bg-slate-950/95 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-900/80 border-b border-slate-800 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-white">DealFlow AI Assistant</p>
                    <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Dealflow Intelligence
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-white rounded-lg"
                    onClick={() => setIsChatMinimized(!isChatMinimized)}
                  >
                    {isChatMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-white rounded-lg"
                    onClick={() => setActiveWidget("none")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              {!isChatMinimized && (
                <CardContent className="p-4 space-y-4">
                  <ScrollArea className="h-80 pr-3">
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
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
                                <UserCheck className="h-3 w-3" /> Escalated to Revenue Specialist
                              </div>
                            )}
                            <p className="text-[9px] opacity-60 mt-1 text-right font-mono">
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" /> Analyzing pipeline data...
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Switch to Booking option in chat footer */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                    <span>Need a live meeting?</span>
                    <button
                      onClick={() => setActiveWidget("call")}
                      className="text-violet-400 hover:text-violet-300 font-bold underline flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" /> Book Strategy Call
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                      placeholder="Ask about pricing, pipelines, or GTM..."
                      className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-xs focus-visible:ring-cyan-500 h-9 rounded-xl"
                    />
                    <Button
                      onClick={handleSendChatMessage}
                      disabled={chatLoading}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white h-9 px-3 rounded-xl"
                    >
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
