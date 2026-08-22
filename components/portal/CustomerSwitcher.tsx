// components/portal/CustomerSwitcher.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Users, 
  Building2, 
  Search, 
  Check, 
  ChevronDown, 
  Plus, 
  X, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { FormValidator } from "@/lib/form-validator";
import { cn } from "@/lib/utils";

export interface CustomerAccountOption {
  id: string;
  name: string;
  companyName: string;
  email?: string;
  industry?: string;
  status?: string;
}

export interface CustomerSwitcherProps {
  customers?: CustomerAccountOption[];
  selectedCustomerId?: string;
  onSelectCustomer?: (customer: CustomerAccountOption) => void;
  onAddCustomer?: (newCustomer: CustomerAccountOption) => Promise<boolean> | boolean;
  className?: string;
  align?: "left" | "right" | "auto";
}

export const DEFAULT_SEEDED_CUSTOMERS: CustomerAccountOption[] = [
  {
    id: "cust-1",
    name: "Praneeth Burada",
    companyName: "Acme Enterprise SaaS",
    email: "praneethburada@gmail.com",
    industry: "Software & Technology",
    status: "active"
  },
  {
    id: "cust-2",
    name: "Anil Kumar",
    companyName: "Global Fintech Dynamics",
    email: "anil@cralgo.com",
    industry: "Financial Technology",
    status: "active"
  },
  {
    id: "cust-3",
    name: "Sarah Jenkins",
    companyName: "Apex HealthTech",
    email: "sarah.j@apexhealthtech.com",
    industry: "Healthcare Software",
    status: "active"
  },
  {
    id: "cust-4",
    name: "Marcus Vance",
    companyName: "HyperScale Analytics",
    email: "marcus@hyperscale.ai",
    industry: "Enterprise AI & Data",
    status: "active"
  }
];

export const FALLBACK_DEFAULT_CUSTOMER: CustomerAccountOption = {
  id: "cust-default",
  name: "Customer Account",
  companyName: "Enterprise Account",
  email: "support@dealflow.ai",
  industry: "Enterprise SaaS",
  status: "active"
};

export function CustomerSwitcher({
  customers = DEFAULT_SEEDED_CUSTOMERS,
  selectedCustomerId,
  onSelectCustomer,
  onAddCustomer,
  className = "",
  align = "auto"
}: CustomerSwitcherProps) {
  const STORAGE_KEY_SELECTED = "dealflow_active_agent_customer_id";
  const STORAGE_KEY_DRAFT = "dealflow_customer_switcher_draft";

  const [isMounted, setIsMounted] = useState(false);
  const [internalCustomers, setInternalCustomers] = useState<CustomerAccountOption[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Merge provided customer list with internal updates and fallbacks
  const customerList = useMemo(() => {
    const map = new Map<string, CustomerAccountOption>();
    
    // 1. Seed with defaults if no external customers
    if (!customers || customers.length === 0) {
      DEFAULT_SEEDED_CUSTOMERS.forEach(c => map.set(c.id, c));
    } else {
      customers.forEach(c => map.set(c.id, c));
    }
    
    // 2. Overlay any internally created customers
    internalCustomers.forEach(c => map.set(c.id, c));

    const result = Array.from(map.values());
    return result.length > 0 ? result : [FALLBACK_DEFAULT_CUSTOMER];
  }, [customers, internalCustomers]);

  // Active Customer Selection State with persistence
  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    if (selectedCustomerId) return selectedCustomerId;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (saved && customerList.some(c => c.id === saved)) return saved;
    }
    return customerList[0]?.id || FALLBACK_DEFAULT_CUSTOMER.id;
  });

  // Dropdown & Search States
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quick-Add Modal States (strictly initialized to empty string, NEVER populated with placeholder text)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newIndustry, setNewIndustry] = useState("Enterprise SaaS");

  // Non-intrusive Validation Errors State (Triggered ONLY on blur or submit, never prematurely on keystroke)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Synchronize when external selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== activeCustomerId) {
      setActiveCustomerId(selectedCustomerId);
    }
  }, [selectedCustomerId, activeCustomerId]);

  // Load any draft input from localStorage on mount (prevents data loss)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.newCustomerName) setNewCustomerName(draft.newCustomerName);
          if (draft.newCompanyName) setNewCompanyName(draft.newCompanyName);
          if (draft.newEmail) setNewEmail(draft.newEmail);
          if (draft.newIndustry) setNewIndustry(draft.newIndustry);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Save in-progress draft on input changes
  const updateDraftStorage = useCallback((name: string, company: string, email: string, industry: string) => {
    if (typeof window === "undefined") return;
    try {
      if (!name && !company && !email) {
        localStorage.removeItem(STORAGE_KEY_DRAFT);
      } else {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify({
          newCustomerName: name,
          newCompanyName: company,
          newEmail: email,
          newIndustry: industry
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtered customer list
  const filteredCustomers = customerList.filter(cust => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.companyName.toLowerCase().includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q)) ||
      (cust.industry && cust.industry.toLowerCase().includes(q))
    );
  });

  const activeCustomer = customerList.find(c => c.id === activeCustomerId) || customerList[0] || FALLBACK_DEFAULT_CUSTOMER;

  // Handle Customer Selection
  const handleSelectCustomer = (customer: CustomerAccountOption) => {
    setActiveCustomerId(customer.id);
    setIsOpen(false);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SELECTED, customer.id);
    }
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  // Input Change Handlers
  const handleNameChange = (val: string) => {
    setNewCustomerName(val);
    updateDraftStorage(val, newCompanyName, newEmail, newIndustry);
    if (formErrors.name) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleCompanyChange = (val: string) => {
    setNewCompanyName(val);
    updateDraftStorage(newCustomerName, val, newEmail, newIndustry);
    if (formErrors.company) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.company;
        return next;
      });
    }
  };

  const handleEmailChange = (val: string) => {
    setNewEmail(val);
    updateDraftStorage(newCustomerName, newCompanyName, val, newIndustry);
    if (formErrors.email) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  // Non-Intrusive On-Blur Validation Handlers
  const handleNameBlur = () => {
    const err = FormValidator.validateField(newCustomerName, { required: true, minLength: 2, maxLength: 80 }, "Customer Name");
    if (err) setFormErrors(prev => ({ ...prev, name: err }));
  };

  const handleCompanyBlur = () => {
    const err = FormValidator.validateField(newCompanyName, { required: true, minLength: 2, maxLength: 100 }, "Company Name");
    if (err) setFormErrors(prev => ({ ...prev, company: err }));
  };

  const handleEmailBlur = () => {
    if (newEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(newEmail.trim())) {
        setFormErrors(prev => ({ ...prev, email: "Please enter a valid email address (e.g. name@company.com)." }));
        return;
      }
    }
  };

  // Handle Form Submission (Validates all fields on commit)
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const nameErr = FormValidator.validateField(newCustomerName, { required: true, minLength: 2, maxLength: 80 }, "Customer Name");
    if (nameErr) errors.name = nameErr;

    const companyErr = FormValidator.validateField(newCompanyName, { required: true, minLength: 2, maxLength: 100 }, "Company Name");
    if (companyErr) errors.company = companyErr;

    if (newEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(newEmail.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const newCust: CustomerAccountOption = {
      id: `cust_${Date.now()}`,
      name: newCustomerName.trim(),
      companyName: newCompanyName.trim(),
      email: newEmail.trim() || undefined,
      industry: newIndustry,
      status: "active"
    };

    try {
      if (onAddCustomer) {
        await onAddCustomer(newCust);
      }
      setInternalCustomers(prev => [newCust, ...prev]);
      handleSelectCustomer(newCust);
      setShowAddModal(false);
      setNewCustomerName("");
      setNewCompanyName("");
      setNewEmail("");
      updateDraftStorage("", "", "", "Enterprise SaaS");
      setSuccessNotice(`Account "${newCust.companyName}" added and switched successfully.`);
      setTimeout(() => setSuccessNotice(null), 3500);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dealflow_customer_switched", { detail: newCust }));
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || "Failed to add customer account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const alignmentClass = align === "left" 
    ? "left-0 origin-top-left" 
    : align === "right" 
    ? "right-0 origin-top-right" 
    : "left-0 sm:left-0 origin-top-left";

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      
      {/* TRIGGER BUTTON (Top Panel Badge & Switcher) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Active Customer: ${activeCustomer.companyName}. Click to switch account.`}
        className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] hover:border-violet-500/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
      >
        <div className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
          <Building2 className="w-3 h-3" />
        </div>

        <div className="flex flex-col text-left max-w-[140px] sm:max-w-[190px] truncate">
          <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] text-[11px] truncate leading-tight">
            {activeCustomer.companyName}
          </span>
          <span className="text-[9px] text-[#86868B] truncate leading-tight">
            {activeCustomer.name}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#86868B] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-violet-400" : ""}`} />
      </button>

      {/* DROPDOWN MENU (Safely bounded & fully visible across viewports) */}
      {isOpen && (
        <div 
          role="listbox" 
          aria-label="Customer accounts"
          className={cn(
            "absolute mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] rounded-2xl bg-white/95 dark:bg-[#161618]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl backdrop-blur-2xl p-2.5 z-50 space-y-2 animate-in fade-in duration-150",
            alignmentClass
          )}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-2 py-1 border-b border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#86868B] font-mono">
              Switch Customer Account
            </span>
            <span className="text-[10px] text-violet-500 dark:text-violet-400 font-mono font-semibold">
              {customerList.length} Accounts
            </span>
          </div>

          {/* Search Input with Stable State & Non-Editable Placeholder */}
          <div className="relative px-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or email..."
              aria-label="Search customer accounts"
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.10] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-none focus:border-violet-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-2.5 text-[#86868B] hover:text-white"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Customer Accounts List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1 px-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#86868B]">
                No customer accounts match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === activeCustomerId;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCustomer(cust)}
                    className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? "bg-violet-600 text-white font-semibold shadow-sm"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-black/[0.05] dark:bg-white/[0.08] text-[#86868B]"
                      }`}>
                        {cust.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs truncate leading-tight">{cust.companyName}</p>
                        <p className={`text-[10px] truncate leading-tight ${isSelected ? "text-violet-100" : "text-[#86868B]"}`}>
                          {cust.name} {cust.industry ? `· ${cust.industry}` : ""}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-white shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Add New Customer Trigger */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAddModal(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-violet-600 hover:text-white text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Customer Account</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK-ADD CUSTOMER MODAL (Portalled to document.body to prevent clipping & containing-block traps) */}
      {showAddModal && isMounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-modal-title"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar my-auto bg-white dark:bg-[#161618] border border-black/[0.1] dark:border-white/[0.15] rounded-3xl shadow-2xl p-6 space-y-5 relative animate-in fade-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] font-mono font-bold text-violet-500 uppercase tracking-wider">
                Workstation Customer Management
              </span>
              <h3 id="quick-add-modal-title" className="text-lg font-bold text-[#1D1D1F] dark:text-white mt-0.5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-500" />
                Add Customer Account
              </h3>
              <p className="text-xs text-[#86868B] mt-0.5">
                Register a new corporate account to switch workspace context immediately.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-left">
              {formErrors.general && (
                <div role="alert" className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* Customer Name */}
              <div className="space-y-1">
                <label htmlFor="modal-customer-name" className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Primary Contact Name <span className="text-violet-400">*</span>
                </label>
                <input
                  id="modal-customer-name"
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="e.g. Sarah Jenkins"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "modal-name-error" : undefined}
                  className={`w-full bg-black/[0.03] dark:bg-white/[0.04] border rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] focus:outline-none ${
                    formErrors.name ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-black/[0.08] dark:border-white/[0.12] focus:border-violet-500"
                  }`}
                />
                {formErrors.name && (
                  <p id="modal-name-error" role="alert" className="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-1">
                <label htmlFor="modal-company-name" className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Company / Organization Name <span className="text-violet-400">*</span>
                </label>
                <input
                  id="modal-company-name"
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  onBlur={handleCompanyBlur}
                  placeholder="e.g. Apex HealthTech Inc."
                  aria-invalid={!!formErrors.company}
                  aria-describedby={formErrors.company ? "modal-company-error" : undefined}
                  className={`w-full bg-black/[0.03] dark:bg-white/[0.04] border rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] focus:outline-none ${
                    formErrors.company ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-black/[0.08] dark:border-white/[0.12] focus:border-violet-500"
                  }`}
                />
                {formErrors.company && (
                  <p id="modal-company-error" role="alert" className="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {formErrors.company}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label htmlFor="modal-email" className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Contact Email Address (Optional)
                </label>
                <input
                  id="modal-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="e.g. sarah.j@apexhealthtech.com"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "modal-email-error" : undefined}
                  className={`w-full bg-black/[0.03] dark:bg-white/[0.04] border rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] focus:outline-none ${
                    formErrors.email ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-black/[0.08] dark:border-white/[0.12] focus:border-violet-500"
                  }`}
                />
                {formErrors.email && (
                  <p id="modal-email-error" role="alert" className="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Industry Selection */}
              <div className="space-y-1">
                <label htmlFor="modal-industry" className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Industry Vertical
                </label>
                <select
                  id="modal-industry"
                  value={newIndustry}
                  onChange={(e) => {
                    setNewIndustry(e.target.value);
                    updateDraftStorage(newCustomerName, newCompanyName, newEmail, e.target.value);
                  }}
                  className="w-full bg-black/[0.03] dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Enterprise SaaS">Enterprise SaaS & Tech</option>
                  <option value="Financial Technology">Financial Technology (Fintech)</option>
                  <option value="Healthcare Software">Healthcare & MedTech</option>
                  <option value="E-Commerce & D2C">E-Commerce & Direct-to-Consumer</option>
                  <option value="Cybersecurity">Cybersecurity & Cloud Infra</option>
                  <option value="Professional Services">Professional & B2B Services</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Save & Switch Account</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Accessible Success Announcement Toast (Portalled to document.body) */}
      {successNotice && isMounted && createPortal(
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[10000] bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successNotice}</span>
        </div>,
        document.body
      )}

    </div>
  );
}
