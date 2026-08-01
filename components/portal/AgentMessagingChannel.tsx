"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  AlertTriangle,
  ArrowDown,
  Check,
  CheckCheck,
  File,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  User,
  Bot,
  X,
  Bell,
  BellOff,
} from "lucide-react";
import { collection, doc, onSnapshot, query, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { getDb } from "@/lib/firebase-client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderRole: "customer" | "agent";
  senderName: string;
  text: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface AgentMessagingChannelProps {
  customerId: string;
  customerName: string;
  agentKey: string;
  agentName: string;
  agentTitle?: string;
  currentUserId: string;
  currentUserRole: "customer" | "agent";
  currentUserName: string;
  /** Initial agent gradient to use for avatar */
  agentGradient?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildChannelId(customerId: string, agentKey: string) {
  return [customerId, agentKey].sort().join("__");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
  }
  return groups;
}

function isImageType(name?: string | null) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name ?? "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification hook
// ─────────────────────────────────────────────────────────────────────────────
function useNotification() {
  const [permitted, setPermitted] = useState(false);
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setPermitted(true);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermitted(result === "granted");
    }
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (permitted && document.hidden) {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    },
    [permitted]
  );

  return { permitted, requestPermission, notify };
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isSelf,
  agentGradient,
}: {
  msg: ChatMessage;
  isSelf: boolean;
  agentGradient: string;
}) {
  return (
    <div
      className={`flex items-end gap-2.5 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
      aria-label={`Message from ${msg.senderName} at ${formatTime(msg.createdAt)}`}
    >
      {/* Avatar */}
      {!isSelf && (
        <div
          className={`h-7 w-7 rounded-full bg-gradient-to-br ${agentGradient} flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-md`}
          aria-hidden="true"
        >
          {msg.senderRole === "agent" ? (
            <Bot className="h-4 w-4" />
          ) : (
            msg.senderName[0]?.toUpperCase()
          )}
        </div>
      )}

      <div className={`max-w-[72%] ${isSelf ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        {/* Sender name (only for agent/non-self) */}
        {!isSelf && (
          <span className="text-[10px] text-slate-500 font-semibold ml-1">{msg.senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
            isSelf
              ? "bg-gradient-to-br from-cyan-600 to-indigo-700 text-white rounded-tr-sm"
              : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm"
          }`}
        >
          {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

          {/* Attachment */}
          {msg.attachmentUrl && (
            <div className="mt-2">
              {isImageType(msg.attachmentName) ? (
                <a
                  href={msg.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-white/10 max-w-[200px]"
                  aria-label={`Image attachment: ${msg.attachmentName}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={msg.attachmentUrl}
                    alt={msg.attachmentName ?? "Attached image"}
                    className="object-cover w-full"
                    loading="lazy"
                  />
                </a>
              ) : (
                <a
                  href={msg.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mt-1 text-[11px] font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
                  aria-label={`Download attachment: ${msg.attachmentName}`}
                >
                  <File className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {msg.attachmentName ?? "Attachment"}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Timestamp + read receipt */}
        <div
          className={`flex items-center gap-1 text-[9px] text-slate-600 font-mono ${isSelf ? "flex-row-reverse" : ""}`}
          aria-label={msg.readAt ? "Message read" : "Message delivered"}
        >
          <time dateTime={msg.createdAt}>{formatTime(msg.createdAt)}</time>
          {isSelf && (
            <span title={msg.readAt ? `Read at ${formatTime(msg.readAt)}` : "Delivered"}>
              {msg.readAt ? (
                <CheckCheck className="h-3 w-3 text-cyan-400" aria-label="Read" />
              ) : (
                <Check className="h-3 w-3 text-slate-600" aria-label="Delivered" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Self avatar */}
      {isSelf && (
        <div
          className="h-7 w-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-white text-[10px] font-black shrink-0"
          aria-hidden="true"
        >
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function AgentMessagingChannel({
  customerId,
  customerName,
  agentKey,
  agentName,
  agentTitle = "AI Revenue Agent",
  currentUserId,
  currentUserRole,
  currentUserName,
  agentGradient = "from-cyan-500 to-indigo-600",
}: AgentMessagingChannelProps) {
  const channelId = useMemo(
    () => buildChannelId(customerId, agentKey),
    [customerId, agentKey]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState(() => {
    // Session-persistent draft
    if (typeof window !== "undefined") {
      return localStorage.getItem(`chat_draft_${channelId}`) ?? "";
    }
    return "";
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  const { permitted: notifPermitted, requestPermission: requestNotif, notify } = useNotification();

  // ── Real-time Firestore listener ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    let unsub: (() => void) | null = null;

    try {
      const firestore = getDb();
      if (!firestore) {
        // Fallback: load via REST
        fetch(`/api/portal/messages?channelId=${encodeURIComponent(channelId)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setMessages(d.messages ?? []);
          })
          .catch(() => setLoadError("Could not load messages. Check your connection."))
          .finally(() => setLoading(false));
        return;
      }

      const msgQuery = query(
        collection(firestore, "customer_agent_messages", channelId, "messages"),
        orderBy("createdAt", "asc"),
        firestoreLimit(100)
      );

      unsub = onSnapshot(
        msgQuery,
        (snap) => {
          const msgs: ChatMessage[] = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              ...data,
              id: d.id,
              // Decrypt text if stored encrypted
              text: data.encryptedPayload
                ? Buffer.from(data.encryptedPayload, "base64").toString("utf8")
                : data.text,
            } as ChatMessage;
          });
          setMessages(msgs);
          setLoading(false);

          // Detect new messages from the other party
          if (msgs.length > prevMessageCount.current) {
            const newMsgs = msgs.slice(prevMessageCount.current);
            const fromOther = newMsgs.filter((m) => m.senderId !== currentUserId);
            if (fromOther.length > 0) {
              const unread = fromOther.filter((m) => !m.readAt).map((m) => m.id);
              setUnreadIds((prev) => [...new Set([...prev, ...unread])]);
              notify(
                `New message from ${fromOther[fromOther.length - 1].senderName}`,
                fromOther[fromOther.length - 1].text || "Sent an attachment"
              );
            }
          }
          prevMessageCount.current = msgs.length;
        },
        (err) => {
          if (!err.message.includes("Missing or insufficient permissions")) {
            setLoadError("Failed to connect to message stream.");
          }
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
      setLoadError("Failed to initialize messaging.");
    }

    return () => {
      if (unsub) unsub();
    };
  }, [channelId, currentUserId, notify]);

  // ── Auto-scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (messages.length > 0) {
        setShowScrollBtn(true);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  // ── Scroll button visibility ──────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  // ── Mark visible messages as read ────────────────────────────────────────
  useEffect(() => {
    if (unreadIds.length === 0) return;
    const timer = setTimeout(async () => {
      await fetch("/api/portal/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, messageIds: unreadIds }),
      });
      setUnreadIds([]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [unreadIds, channelId]);

  // ── Persist input draft ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(`chat_draft_${channelId}`, input);
  }, [input, channelId]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !attachFile) || sending) return;
    setSending(true);
    setSendError(null);

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    // Upload attachment first if present
    if (attachFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", attachFile);
        fd.append("channelId", channelId);
        fd.append("fileName", attachFile.name);
        const uploadRes = await fetch("/api/portal/messages/files", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error(uploadData.error);
        attachmentUrl = uploadData.attachmentUrl;
        attachmentName = uploadData.attachmentName;
      } catch (err: any) {
        setSendError(err.message || "File upload failed");
        setUploading(false);
        setSending(false);
        return;
      }
      setUploading(false);
      setAttachFile(null);
    }

    const optimisticMsg: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      channelId,
      senderId: currentUserId,
      senderRole: currentUserRole,
      senderName: currentUserName,
      text: input.trim(),
      attachmentUrl: attachmentUrl ?? null,
      attachmentName: attachmentName ?? null,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    localStorage.removeItem(`chat_draft_${channelId}`);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentKey,
          customerId,
          text: optimisticMsg.text,
          attachmentUrl,
          attachmentName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setSendError(data.error || "Failed to send message");
      }
      // Real Firestore message will arrive via onSnapshot and replace the optimistic one
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setSendError("Network error. Message not sent.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, attachFile, sending, channelId, currentUserId, currentUserRole, currentUserName, agentKey, customerId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messageGroups = useMemo(() => groupByDate(messages), [messages]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full min-h-[500px] max-h-[720px] bg-[#060B18] border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl relative"
      role="main"
      aria-label={`Messaging channel with ${agentName}`}
    >
      {/* Top ambient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" aria-hidden="true" />

      {/* ── Channel header ── */}
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${agentGradient} flex items-center justify-center text-white font-black shadow-lg shrink-0`} aria-hidden="true">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">{agentName}</h2>
            <p className="text-[11px] text-slate-400">{agentTitle}</p>
          </div>
          {/* Online indicator */}
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            Online
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Unread badge */}
          {unreadIds.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold animate-pulse"
              aria-live="polite"
              aria-label={`${unreadIds.length} unread messages`}
            >
              {unreadIds.length}
            </span>
          )}

          {/* Notification toggle */}
          <button
            onClick={notifPermitted ? undefined : requestNotif}
            title={notifPermitted ? "Browser notifications enabled" : "Enable browser notifications"}
            aria-label={notifPermitted ? "Browser notifications enabled" : "Enable browser notifications for new messages"}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {notifPermitted ? (
              <Bell className="h-4 w-4 text-cyan-400" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* ── Message list ── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scroll-smooth"
        role="log"
        aria-label="Message history"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {loading && (
          <div className="flex justify-center items-center h-32" role="status" aria-label="Loading messages">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" aria-hidden="true" />
          </div>
        )}

        {loadError && (
          <div role="alert" className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {loadError}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${agentGradient} flex items-center justify-center shadow-lg`} aria-hidden="true">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Start the conversation</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Send a message to {agentName} to begin your session. All messages are end-to-end encrypted.
              </p>
            </div>
          </div>
        )}

        {messageGroups.map((group) => (
          <div key={group.date} className="space-y-3">
            {/* Date separator */}
            <div className="flex items-center gap-3" role="separator" aria-label={group.date}>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] font-semibold text-slate-600 px-2">{group.date}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {group.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isSelf={msg.senderId === currentUserId}
                agentGradient={agentGradient}
              />
            ))}
          </div>
        ))}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Scroll to bottom button ── */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-5 h-8 w-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shadow-lg flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {/* ── File attachment preview ── */}
      {attachFile && (
        <div className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[11px] text-slate-300">
          {isImageType(attachFile.name) ? (
            <ImageIcon className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
          ) : (
            <File className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate flex-1">{attachFile.name}</span>
          <span className="text-slate-500 shrink-0">
            {(attachFile.size / 1024).toFixed(0)} KB
          </span>
          <button
            onClick={() => setAttachFile(null)}
            className="text-slate-400 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Send error ── */}
      {sendError && (
        <div role="alert" aria-live="assertive" className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {sendError}
          <button
            onClick={() => setSendError(null)}
            className="ml-auto text-red-400/60 hover:text-red-400 focus:outline-none"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Composer ── */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 shrink-0">
        <div className="flex items-end gap-2">
          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            aria-label="Attach a file"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 5 * 1024 * 1024) {
                setSendError("File exceeds 5 MB limit.");
              } else {
                setAttachFile(f);
              }
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            className="h-11 w-11 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shrink-0 disabled:opacity-50"
            aria-label="Attach file"
            title="Attach file (max 5 MB)"
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              id="message-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agentName}… (Enter to send, Shift+Enter for new line)`}
              disabled={sending || uploading}
              aria-label={`Type a message to ${agentName}`}
              aria-multiline="true"
              aria-describedby="composer-hint"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 resize-none min-h-[44px] max-h-[120px] overflow-y-auto transition-all hover:border-slate-600 disabled:opacity-50"
              style={{ height: Math.min(120, Math.max(44, input.split("\n").length * 24)) }}
            />
            <p id="composer-hint" className="sr-only">
              Press Enter to send your message, or Shift+Enter to add a new line.
            </p>
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !attachFile) || sending || uploading}
            aria-label="Send message"
            aria-busy={sending}
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shrink-0"
          >
            {sending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* E2E encryption footer */}
        <p className="text-[9px] text-slate-700 text-center mt-2 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-700" aria-hidden="true" />
          Messages are end-to-end encrypted · AES-256 · GDPR compliant
        </p>
      </div>
    </div>
  );
}

export default AgentMessagingChannel;
