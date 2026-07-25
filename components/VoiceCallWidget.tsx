"use client";

import { useEffect, useState } from "react";
import { Phone, X, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingWidget } from "@/components/BookingWidget";

export function VoiceCallWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    window.addEventListener("open-voice-call", handleOpen);
    window.addEventListener("close-voice-call", handleClose);
    return () => {
      window.removeEventListener("open-voice-call", handleOpen);
      window.removeEventListener("close-voice-call", handleClose);
    };
  }, []);

  useEffect(() => {
    const heroElement = document.getElementById("hero");
    if (heroElement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Show button when hero is NOT intersecting (scrolled past)
          setShowButton(!entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(heroElement);
      return () => observer.disconnect();
    } else {
      setShowButton(true);
    }
  }, []);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <AnimatePresence>
        {!isOpen && showButton && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-8 bg-violet-600 hover:bg-violet-500 text-white px-5 py-3.5 rounded-full shadow-lg z-50 flex items-center gap-2.5 border border-violet-400/20 group focus-visible:outline-none font-bold text-xs uppercase tracking-wider shadow-violet-500/25"
            aria-label="Book a call"
          >
            <Calendar className="h-4.5 w-4.5 text-violet-200" />
            <span>Book a call</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Glassmorphic Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Background Closer */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsOpen(false)} />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-10"
            >
              {/* Header inside modal */}
              <div className="absolute top-4 right-4 z-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close scheduler"
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
                  onClose={() => setIsOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
