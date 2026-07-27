"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Target, Zap, TrendingUp, Shield } from "lucide-react";
import { IntakeForm } from "@/components/IntakeForm";

export default function GoToMarketAssessmentPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f3f0]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-[#24252a] bg-[#111219]/40 text-slate-400 hover:text-white hover:bg-[#16181f] transition-all duration-300 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8a704c]/30 bg-[#8a704c]/10 text-[#d4a017] text-xs font-semibold uppercase tracking-widest mb-3">
            <Target className="h-4 w-4" />
            Go-to-Market Assessment
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-light text-white leading-tight mb-4">
            Transform Your GTM Strategy with AI
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
            Complete our comprehensive assessment to unlock personalized AI-powered recommendations for your ideal customer profile, outreach sequences, and go-to-market roadmap.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Content */}
          <div className="lg:col-span-4 space-y-8">
            {/* Benefits */}
            <div className="space-y-6">
              <h3 className="font-display text-lg font-light text-white">What you&apos;ll get</h3>
              {[
                {
                  icon: Zap,
                  title: "Ideal Customer Profile",
                  description: "AI-generated ICP with detailed firmographics, pain points, and buying triggers.",
                },
                {
                  icon: TrendingUp,
                  title: "Outreach Strategy",
                  description: "Personalized email sequences and social media messaging frameworks.",
                },
                {
                  icon: Shield,
                  title: "Compliance & Security",
                  description: "Built-in compliance checks for GDPR, TCPA, and industry-specific regulations.",
                },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="border border-[#24252a]/80 bg-[#111219]/40 rounded-lg p-5 flex gap-4 items-start hover:border-[#d4a017]/40 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-[#8a704c]/10 text-[#d4a017] rounded-md border border-[#8a704c]/20 shrink-0">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-medium text-white mb-1">{benefit.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="border border-[#24252a]/80 bg-gradient-to-br from-[#111219]/60 to-[#111219]/20 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-3xl font-display text-[#d4a017] font-light">10x</p>
                  <p className="text-xs text-slate-400 mt-1">Faster strategy generation</p>
                </div>
                <div>
                  <p className="text-3xl font-display text-[#d4a017] font-light">95%</p>
                  <p className="text-xs text-slate-400 mt-1">Data accuracy guarantee</p>
                </div>
                <div>
                  <p className="text-3xl font-display text-[#d4a017] font-light">24/7</p>
                  <p className="text-xs text-slate-400 mt-1">AI agent availability</p>
                </div>
                <div>
                  <p className="text-3xl font-display text-[#d4a017] font-light">500+</p>
                  <p className="text-xs text-slate-400 mt-1">Companies assessed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Intake Form */}
          <div className="lg:col-span-8">
            <IntakeForm />
          </div>
        </div>
      </div>
    </div>
  );
}

