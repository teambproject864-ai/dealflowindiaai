// lib/customer-accounts.ts

export interface CustomerAccountOption {
  id: string;
  name: string;
  companyName: string;
  email?: string;
  industry?: string;
  status?: string;
}

export const DEFAULT_SEEDED_CUSTOMERS: CustomerAccountOption[] = [];

export const FALLBACK_DEFAULT_CUSTOMER: CustomerAccountOption = {
  id: "",
  name: "Select Customer Account",
  companyName: "No Customer Selected",
  email: "",
  industry: "",
  status: "none"
};
