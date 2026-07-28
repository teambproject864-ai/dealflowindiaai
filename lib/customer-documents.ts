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

export const mockCustomerDocs: Record<string, CustomerDocument[]> = {
  "customer-demo": [
    {
      id: "doc-icp-1",
      name: "Enterprise Segment ICP Profile.pdf",
      type: "pdf",
      size: "2.8 MB",
      version: "1.1",
      updatedAt: "2026-06-28T14:30:00Z",
      updateNotes: "Updated target geographies and CRM tool parameters.",
      isNew: true,
    },
    {
      id: "doc-spec-2",
      name: "Revenue Agent Bot Configuration.xlsx",
      type: "xlsx",
      size: "1.4 MB",
      version: "2.0",
      updatedAt: "2026-06-25T09:15:00Z",
      updateNotes: "Added custom objections mapping sheet.",
      isNew: false,
    },
    {
      id: "doc-perf-3",
      name: "Q2 GTM Outbound Performance Summary.pdf",
      type: "pdf",
      size: "4.1 MB",
      version: "1.0",
      updatedAt: "2026-06-20T11:00:00Z",
      updateNotes: "Initial release of quarterly performance document.",
      isNew: false,
    },
  ],
};
