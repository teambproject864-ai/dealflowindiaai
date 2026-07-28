"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Shield, Info, AlertTriangle, Cpu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "alert";
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "GTM Roadmap Generated",
    description: "Acme Corp GTM alignment analysis finished successfully.",
    type: "success",
    time: "2m ago",
    unread: true,
  },
  {
    id: "notif-2",
    title: "Shield Triggered",
    description: "Clawpatrol blocked a malicious prompt injection attempt.",
    type: "alert",
    time: "15m ago",
    unread: true,
  },
  {
    id: "notif-3",
    title: "Hermes OS Sync",
    description: "Memory consolidation complete. 42 entries consolidated to LTM.",
    type: "info",
    time: "1h ago",
    unread: false,
  },
  {
    id: "notif-4",
    title: "Rate Limit Warning",
    description: "Email automation agent is approaching outbound limit.",
    type: "warning",
    time: "4h ago",
    unread: false,
  },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize notifications from localStorage or fallback to mock
  useEffect(() => {
    const saved = localStorage.getItem("df_notifications");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } else {
      setNotifications(MOCK_NOTIFICATIONS);
    }
  }, []);

  // Save changes to local storage
  const saveNotifs = (updated: NotificationItem[]) => {
    setNotifications(updated);
    localStorage.setItem("df_notifications", JSON.stringify(updated));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    saveNotifs(updated);
  };

  const toggleRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, unread: !n.unread } : n
    );
    saveNotifs(updated);
  };

  const deleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    saveNotifs(updated);
  };

  const clearAll = () => {
    saveNotifs([]);
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <Cpu className="h-4 w-4 text-emerald-400" />;
      case "alert":
        return <Shield className="h-4 w-4 text-red-400 animate-pulse" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Info className="h-4 w-4 text-teal-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative z-40">
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl border transition-all duration-300 ${
          isOpen
            ? "border-teal-500/30 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
            : "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
        }`}
        aria-label="View notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {mounted && unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 text-[10px] font-bold text-slate-950 ring-2 ring-[#060612]"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.2, 1, 0.3, 1] }}
            className="absolute right-0 sm:right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm rounded-3xl dropdown-glass shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-teal-500 dark:text-teal-400" />
                <span className="font-bold text-sm text-slate-850 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-500/20 dark:border-transparent dark:text-teal-300 text-[10px] font-bold">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-teal-750 dark:text-teal-400 hover:text-teal-850 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 font-medium transition-all duration-300"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-red-650 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-all duration-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 scrim-bg">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-slate-650 dark:text-slate-500 opacity-60" />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">All caught up!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">No new system alerts.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => toggleRead(notif.id)}
                    className={`relative px-5 py-4 flex gap-3.5 transition-all duration-300 cursor-pointer group ${
                      notif.unread ? "bg-gradient-to-r from-teal-500/10 to-transparent dark:from-teal-500/5 dark:to-transparent" : "hover:bg-slate-100/60 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {notif.unread && (
                      <motion.div
                        layoutId="unread-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-cyan-400"
                      />
                    )}

                    {/* Icon */}
                    <div className={`p-2.5 rounded-2xl h-fit border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 ${notif.unread ? "border-teal-200 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10" : ""}`}>
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold ${notif.unread ? "text-slate-950 dark:text-white" : "text-slate-750 dark:text-slate-300"} line-clamp-1`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1.5">
                        {notif.description}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => deleteNotif(notif.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-400 transition-all duration-300 self-start"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
