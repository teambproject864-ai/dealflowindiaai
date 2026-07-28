"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { SPRING_SNAPPY } from "@/lib/immersive3d/motion";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (wasOffline.current && online) {
      setSyncing(true);
      (async () => {
        try {
          const { getAllUnsyncedLeads, markLeadSynced } = await import("@/lib/offlineStore");
          const unsynced = await getAllUnsyncedLeads();
          for (const item of unsynced) {
            try {
              if (item.leadId && item.data) {
                await fetch("/api/leads/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(item.data),
                });
                await markLeadSynced(item.leadId);
              }
            } catch (syncErr) {
              console.warn(`[OfflineSync] Failed syncing lead ${item.leadId}:`, syncErr);
            }
          }
        } catch (e) {
          console.error("[OfflineSync] Error during background sync loop:", e);
        } finally {
          setSyncing(false);
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 3000);
        }
      })();
    }
    if (!online) wasOffline.current = true;
  }, [online]);

  return (
    <>
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={SPRING_SNAPPY}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] df-glass px-5 py-3 flex items-center gap-3"
            role="alert"
          >
            <WifiOff className="h-4 w-4 text-amber-400" aria-hidden />
            <span className="text-sm text-[#C8B8FF]">
              Working offline — showing cached data
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] df-glass px-5 py-3 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-sm text-white">Syncing…</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestored && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] df-glass px-5 py-3 flex items-center gap-2 immersive-glow-primary"
          >
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
            <span className="text-sm text-white">Back online — data refreshed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
