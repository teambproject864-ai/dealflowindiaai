"use client";

import { GlassPanel } from "@/components/immersive/GlassPanel";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#060612] text-slate-100 py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <header className="space-y-4 mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-slate-400">Last updated: June 20, 2026</p>
        </header>

        <GlassPanel material="glass" depth="mid" className="p-8 md:p-12 border-white/10 shadow-2xl space-y-8 text-slate-300 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. Introduction</h2>
            <p>
              Welcome to DealFlow AI. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal info, please contact us at support@dealflow.ai.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products, or otherwise when you contact us.
            </p>
            <p>
              This information may include: contact data (such as name, email address, phone number), credentials, billing details, and pipeline data that you connect to our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. How We Use Your Information</h2>
            <p>
              We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.
            </p>
            <p>
              Specifically, we use it to provide and facilitate delivery of services, send administrative information, respond to inquiries, and protect our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">4. GDPR and Data Protection</h2>
            <p>
              For users in the European Union, we adhere to the General Data Protection Regulation (GDPR). We ensure all PII data (including emails and phone numbers) is securely encrypted at rest using AES-256-GCM. You have the right to request access to, correction of, or erasure of your personal data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">5. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, you may email us at hello@dealflow.ai.
            </p>
          </section>
        </GlassPanel>
      </div>
    </main>
  );
}
