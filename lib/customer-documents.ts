export interface CustomerDocument {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "json";
  size: string;
  version: string;
  updatedAt: string;
  updateNotes: string;
  isNew: boolean;
}

export const mockCustomerDocs: Record<string, CustomerDocument[]> = {};
