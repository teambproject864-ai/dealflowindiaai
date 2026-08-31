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
  ArrowRight,
  Trash2,
  UserCheck,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { FormValidator } from "@/lib/form-validator";
import { cn } from "@/lib/utils";
import { 
  CustomerAccountOption, 
  DEFAULT_SEEDED_CUSTOMERS, 
  FALLBACK_DEFAULT_CUSTOMER 
} from "@/lib/customer-accounts";
import { REVENUE_AGENTS } from "@/lib/types";

export type { CustomerAccountOption };
export { DEFAULT_SEEDED_CUSTOMERS, FALLBACK_DEFAULT_CUSTOMER };

export interface CustomerSwitcherProps {
  customers?: CustomerAccountOption[];
  selectedCustomerId?: string;
  onSelectCustomer?: (customer: CustomerAccountOption) => void;
  onAddCustomer?: (newCustomer: CustomerAccountOption) => Promise<boolean> | boolean;
  onDeleteCustomer?: (customerId: string) => Promise<boolean> | boolean;
  onReassignCustomer?: (customerId: string, newAgentKey: string) => Promise<boolean> | boolean;
  className?: string;
  align?: "left" | "right" | "auto";
}

const STORAGE_KEY_SELECTED = "dealflow_active_agent_customer_id";
const STORAGE_KEY_CUSTOMERS = "dealflow_customer_accounts_cache";
const STORAGE_KEY_DRAFT = "dealflow_customer_switcher_draft";

export function CustomerSwitcher({
  customers = DEFAULT_SEEDED_CUSTOMERS,
  selectedCustomerId,
  onSelectCustomer,
  onAddCustomer,
  onDeleteCustomer,
  onReassignCustomer,
  className = "",
  align = "auto"
}: CustomerSwitcherProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [internalCustomers, setInternalCustomers] = useState<CustomerAccountOption[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Merge external customers with internal records and persistent cache
  const customerList = useMemo(() => {
    const map = new Map<string, CustomerAccountOption>();
    
    // 1. Seed with defaults if no external customers
    if (customers && customers.length > 0) {
      customers.forEach(c => map.set(c.id, c));
    }
    
    // 2. Overlay internally cached and stored customers
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
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; right: number } | null>(null);

  // Quick-Add Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newIndustry, setNewIndustry] = useState("Enterprise SaaS");
  const [newAgentKey, setNewAgentKey] = useState("ashok");

  // Reassign Modal States
  const [reassignCustomer, setReassignCustomer] = useState<CustomerAccountOption | null>(null);
  const [reassignTargetAgentKey, setReassignTargetAgentKey] = useState<string>("praneeth");
  const [isReassigning, setIsReassigning] = useState(false);

  // Delete Confirmation State
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerAccountOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Validation & Feedback States
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const updatePosition = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 8,
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  // Re-calculate position on scroll/resize when open
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Synchronize when external selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== activeCustomerId) {
      setActiveCustomerId(selectedCustomerId);
    }
  }, [selectedCustomerId, activeCustomerId]);

  // Fetch customer accounts from backend API on mount
  const loadCustomersFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      setStorageError(null);
      const res = await fetch("/api/portal/customers");
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && Array.isArray(data.customers)) {
          setInternalCustomers(data.customers);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(data.customers));
            } catch (e) {
              console.warn("[CustomerSwitcher] localStorage write error:", e);
            }
          }
        } else if (!res.ok) {
          throw new Error(data.error || "Failed to fetch customers from server.");
        }
      }
    } catch (e: any) {
      console.warn("[CustomerSwitcher] Backend fetch warning, using local/cached list:", e);
      setStorageError(e.message || "Failed to sync customers from server. Displaying cached data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomersFromBackend();
  }, [loadCustomersFromBackend]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.newCustomerName) setNewCustomerName(draft.newCustomerName);
          if (draft.newCompanyName) setNewCompanyName(draft.newCompanyName);
          if (draft.newEmail) setNewEmail(draft.newEmail);
          if (draft.newPhone) setNewPhone(draft.newPhone);
          if (draft.newIndustry) setNewIndustry(draft.newIndustry);
          if (draft.newAgentKey) setNewAgentKey(draft.newAgentKey);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Save in-progress draft on input changes
  const updateDraftStorage = useCallback((name: string, company: string, email: string, phone: string, industry: string, agent: string) => {
    if (typeof window === "undefined") return;
    try {
      if (!name && !company && !email && !phone) {
        localStorage.removeItem(STORAGE_KEY_DRAFT);
      } else {
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify({
          newCustomerName: name,
          newCompanyName: company,
          newEmail: email,
          newPhone: phone,
          newIndustry: industry,
          newAgentKey: agent,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customerList;
    return customerList.filter(cust => (
      cust.name.toLowerCase().includes(q) ||
      cust.companyName.toLowerCase().includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q)) ||
      (cust.industry && cust.industry.toLowerCase().includes(q)) ||
      (cust.assignedAgentName && cust.assignedAgentName.toLowerCase().includes(q))
    ));
  }, [customerList, searchQuery]);

  const activeCustomer = customerList.find(c => c.id === activeCustomerId) || customerList[0] || FALLBACK_DEFAULT_CUSTOMER;

  // Handle Customer Selection
  const handleSelectCustomer = (customer: CustomerAccountOption) => {
    setActiveCustomerId(customer.id);
    setIsOpen(false);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_SELECTED, customer.id);
      } catch {
        // ignore
      }
    }
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  // Input Change Handlers
  const handleNameChange = (val: string) => {
    setNewCustomerName(val);
    updateDraftStorage(val, newCompanyName, newEmail, newPhone, newIndustry, newAgentKey);
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
    updateDraftStorage(newCustomerName, val, newEmail, newPhone, newIndustry, newAgentKey);
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
    updateDraftStorage(newCustomerName, newCompanyName, val, newPhone, newIndustry, newAgentKey);
    if (formErrors.email) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const handlePhoneChange = (val: string) => {
    setNewPhone(val);
    updateDraftStorage(newCustomerName, newCompanyName, newEmail, val, newIndustry, newAgentKey);
  };

  // On-Blur Validation Handlers
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
      }
    }
  };

  // Handle Form Submission (Create Customer)
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
    setFormErrors({});

    const selectedAgent = REVENUE_AGENTS.find(a => a.key === newAgentKey) || REVENUE_AGENTS[0];

    let createdCustomer: CustomerAccountOption = {
      id: `cust_${Date.now()}`,
      name: newCustomerName.trim(),
      companyName: newCompanyName.trim(),
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      industry: newIndustry,
      assignedAgentKey: selectedAgent.key,
      assignedAgentName: selectedAgent.name,
      assignedAgentId: `agent-${selectedAgent.key}`,
      status: "active",
    };

    try {
      // 1. Persist customer to backend API
      const res = await fetch("/api/portal/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          companyName: newCompanyName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          industry: newIndustry,
          assignedAgentKey: selectedAgent.key,
          assignedAgentName: selectedAgent.name,
          assignedAgentId: `agent-${selectedAgent.key}`,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.customer) {
          createdCustomer = data.customer;
        } else if (!res.ok) {
          throw new Error(data.error || "Failed to save customer account to persistent storage.");
        }
      }

      // 2. Call optional parent handler
      if (onAddCustomer) {
        await onAddCustomer(createdCustomer);
      }

      // 3. Update internal state & localStorage cache
      setInternalCustomers(prev => {
        const next = [createdCustomer, ...prev.filter(c => c.id !== createdCustomer.id)];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(next));
          } catch (e) {
            console.warn("[CustomerSwitcher] Cache write warning:", e);
          }
        }
        return next;
      });

      handleSelectCustomer(createdCustomer);
      setShowAddModal(false);
      setNewCustomerName("");
      setNewCompanyName("");
      setNewEmail("");
      setNewPhone("");
      updateDraftStorage("", "", "", "", "Enterprise SaaS", "ashok");
      setSuccessNotice(`Account "${createdCustomer.companyName}" successfully created and saved.`);
      setTimeout(() => setSuccessNotice(null), 3500);

      // 4. Dispatch global event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dealflow_customer_switched", { detail: createdCustomer }));
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || "Failed to save customer account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reassign Customer Submit
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignCustomer) return;

    setIsReassigning(true);
    setFormErrors({});

    const selectedAgent = REVENUE_AGENTS.find(a => a.key === reassignTargetAgentKey) || REVENUE_AGENTS[0];

    try {
      const res = await fetch("/api/portal/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reassignCustomer.id,
          assignedAgentKey: selectedAgent.key,
          assignedAgentName: selectedAgent.name,
          assignedAgentId: `agent-${selectedAgent.key}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reassign customer on server.");
      }

      const updatedCustomer: CustomerAccountOption = data.customer || {
        ...reassignCustomer,
        assignedAgentKey: selectedAgent.key,
        assignedAgentName: selectedAgent.name,
        assignedAgentId: `agent-${selectedAgent.key}`,
      };

      if (onReassignCustomer) {
        await onReassignCustomer(reassignCustomer.id, selectedAgent.key);
      }

      setInternalCustomers(prev => {
        const next = prev.map(c => c.id === reassignCustomer.id ? updatedCustomer : c);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });

      setReassignCustomer(null);
      setSuccessNotice(`Reassigned "${reassignCustomer.companyName}" to agent ${selectedAgent.name}.`);
      setTimeout(() => setSuccessNotice(null), 3500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dealflow_customer_reassigned", { detail: updatedCustomer }));
      }
    } catch (err: any) {
      setFormErrors({ reassign: err.message || "Failed to reassign agent." });
    } finally {
      setIsReassigning(false);
    }
  };

  // Handle Delete Customer Submit
  const handleDeleteSubmit = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    setFormErrors({});

    try {
      const res = await fetch(`/api/portal/customers?id=${encodeURIComponent(deletingCustomer.id)}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete customer account from storage.");
      }

      if (onDeleteCustomer) {
        await onDeleteCustomer(deletingCustomer.id);
      }

      setInternalCustomers(prev => {
        const next = prev.filter(c => c.id !== deletingCustomer.id);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });

      // If active customer was deleted, switch to first available or fallback
      if (activeCustomerId === deletingCustomer.id) {
        const remaining = customerList.filter(c => c.id !== deletingCustomer.id);
        const nextActive = remaining[0] || FALLBACK_DEFAULT_CUSTOMER;
        setActiveCustomerId(nextActive.id);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY_SELECTED, nextActive.id);
          } catch {
            // ignore
          }
        }
        if (onSelectCustomer) {
          onSelectCustomer(nextActive);
        }
      }

      const deletedName = deletingCustomer.companyName;
      setDeletingCustomer(null);
      setSuccessNotice(`Customer "${deletedName}" deleted successfully.`);
      setTimeout(() => setSuccessNotice(null), 3500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dealflow_customer_deleted", { detail: { id: deletingCustomer.id } }));
      }
    } catch (err: any) {
      setFormErrors({ delete: err.message || "Failed to delete customer." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      
      {/* TRIGGER BUTTON (Top Panel Badge & Switcher) */}
      <button
        type="button"
        onClick={toggleDropdown}
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
          <span className="text-[9px] text-[#86868B] truncate leading-tight flex items-center gap-1">
            <span>{activeCustomer.name}</span>
            {activeCustomer.assignedAgentName && (
              <span className="text-violet-500 dark:text-violet-400 font-medium">· {activeCustomer.assignedAgentName}</span>
            )}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#86868B] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-violet-400" : ""}`} />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && isMounted && dropdownCoords && createPortal(
        <div 
          ref={dropdownMenuRef}
          role="listbox" 
          aria-label="Customer accounts"
          style={{
            position: "fixed",
            top: `${dropdownCoords.top}px`,
            ...(align === "right"
              ? { right: `${Math.max(12, dropdownCoords.right)}px` }
              : { left: `${Math.max(12, Math.min(dropdownCoords.left, (typeof window !== "undefined" ? window.innerWidth : 1200) - 360))}px` }),
            zIndex: 99999,
          }}
          className="w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl bg-white/98 dark:bg-[#161618]/98 border border-black/[0.12] dark:border-white/[0.18] shadow-2xl backdrop-blur-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-2 py-1 border-b border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#86868B] font-mono flex items-center gap-1.5">
              <Users className="w-3 h-3 text-violet-500" />
              Switch Customer Account
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadCustomersFromBackend}
                title="Refresh customer accounts"
                className="text-[#86868B] hover:text-violet-400 transition-colors p-0.5"
              >
                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin text-violet-500")} />
              </button>
              <span className="text-[10px] text-violet-500 dark:text-violet-400 font-mono font-semibold">
                {customerList.length} Accounts
              </span>
            </div>
          </div>

          {/* Storage / Connection Warning */}
          {storageError && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{storageError}</span>
            </div>
          )}

          {/* Search Input */}
          <div className="relative px-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, company, email, agent..."
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
          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1.5 px-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-5 text-xs text-[#86868B]">
                No customer accounts match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === activeCustomerId;
                return (
                  <div
                    key={cust.id}
                    className={`group/item w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2 border ${
                      isSelected
                        ? "bg-violet-600 text-white font-semibold border-violet-500 shadow-sm"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] border-transparent"
                    }`}
                  >
                    {/* Select customer action */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCustomer(cust)}
                      className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-violet-500/10 text-violet-500 dark:bg-white/[0.08] dark:text-violet-400"
                      }`}>
                        {cust.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className="font-bold text-xs truncate leading-tight">{cust.companyName}</p>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </div>
                        <p className={`text-[10px] truncate leading-tight mt-0.5 ${isSelected ? "text-violet-100" : "text-[#86868B]"}`}>
                          {cust.name} {cust.industry ? `· ${cust.industry}` : ""}
                        </p>
                        {cust.assignedAgentName && (
                          <p className={`text-[9px] font-mono mt-0.5 ${isSelected ? "text-violet-200" : "text-violet-600 dark:text-violet-400"}`}>
                            Agent: {cust.assignedAgentName}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Action buttons (Reassign Agent & Delete) */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover/item:opacity-100">
                      {cust.id && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReassignCustomer(cust);
                              setReassignTargetAgentKey(cust.assignedAgentKey || "praneeth");
                              setIsOpen(false);
                            }}
                            title="Reassign to another agent"
                            className={`p-1 rounded-lg transition-colors ${
                              isSelected
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-violet-500/10 text-[#86868B] hover:text-violet-500"
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCustomer(cust);
                              setIsOpen(false);
                            }}
                            title="Delete customer"
                            className={`p-1 rounded-lg transition-colors ${
                              isSelected
                                ? "hover:bg-rose-500 text-white"
                                : "hover:bg-rose-500/10 text-[#86868B] hover:text-rose-500"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
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
        </div>,
        document.body
      )}

      {/* QUICK-ADD CUSTOMER MODAL */}
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

              {/* Assigned Agent */}
              <div className="space-y-1">
                <label htmlFor="modal-agent" className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Assigned Revenue Agent
                </label>
                <select
                  id="modal-agent"
                  value={newAgentKey}
                  onChange={(e) => {
                    setNewAgentKey(e.target.value);
                    updateDraftStorage(newCustomerName, newCompanyName, newEmail, newPhone, newIndustry, e.target.value);
                  }}
                  className="w-full bg-black/[0.03] dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:border-violet-500"
                >
                  {REVENUE_AGENTS.map((agent) => (
                    <option key={agent.key} value={agent.key}>
                      {agent.name} — {agent.title}
                    </option>
                  ))}
                </select>
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
                    updateDraftStorage(newCustomerName, newCompanyName, newEmail, newPhone, e.target.value, newAgentKey);
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

      {/* REASSIGN AGENT MODAL */}
      {reassignCustomer && isMounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reassign-modal-title"
          onClick={() => setReassignCustomer(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#161618] border border-black/[0.1] dark:border-white/[0.15] rounded-3xl shadow-2xl p-6 space-y-5 relative animate-in fade-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setReassignCustomer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold text-violet-500 uppercase tracking-wider">
                Workforce Reassignment
              </span>
              <h3 id="reassign-modal-title" className="text-lg font-bold text-[#1D1D1F] dark:text-white mt-0.5 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-500" />
                Reassign Customer
              </h3>
              <p className="text-xs text-[#86868B] mt-0.5">
                Transfer account management for <strong className="text-[#1D1D1F] dark:text-white">{reassignCustomer.companyName}</strong> to another revenue agent.
              </p>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4 text-left">
              {formErrors.reassign && (
                <div role="alert" className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formErrors.reassign}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 block">
                  Select New Revenue Agent
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {REVENUE_AGENTS.map((agent) => {
                    const isCurrent = reassignCustomer.assignedAgentKey === agent.key;
                    const isSelected = reassignTargetAgentKey === agent.key;
                    return (
                      <button
                        key={agent.key}
                        type="button"
                        onClick={() => setReassignTargetAgentKey(agent.key)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                          isSelected
                            ? "bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-300 font-semibold"
                            : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7]"
                        }`}
                      >
                        <div>
                          <p className="font-bold flex items-center gap-1.5">
                            <span>{agent.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[#86868B]">Current</span>
                            )}
                          </p>
                          <p className="text-[10px] text-[#86868B]">{agent.title}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-violet-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReassignCustomer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isReassigning ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reassigning...</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Confirm Reassignment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCustomer && isMounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={() => setDeletingCustomer(null)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#161618] border border-rose-500/30 rounded-3xl shadow-2xl p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 id="delete-modal-title" className="text-base font-bold text-[#1D1D1F] dark:text-white">
                Delete Customer Account?
              </h3>
              <p className="text-xs text-[#86868B] mt-1">
                Are you sure you want to permanently delete <strong className="text-[#1D1D1F] dark:text-white">{deletingCustomer.companyName}</strong>? All persistent records and conversation contexts for this customer will be removed.
              </p>
            </div>

            {formErrors.delete && (
              <div role="alert" className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formErrors.delete}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" /> Delete Account</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Accessible Success Announcement Toast */}
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
