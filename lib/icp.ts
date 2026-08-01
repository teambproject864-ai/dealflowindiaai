import { IntakeFormData, LeadRecord } from "./types";

/**
 * ICP (Ideal Customer Profile) Definition
 */
export interface ICPDefinition {
  id: string;
  name: string;
  description: string;
  targetIndustries: string[];
  targetCompanySizes: string[];
  targetRevenueRanges: string[];
  suitabilityCriteria: (data: Partial<LeadRecord | IntakeFormData>) => boolean;
  documentUrl: string;
}

/**
 * Matching result for a company and an ICP
 */
export interface ICPMatchResult {
  leadId: string;
  companyName: string;
  matchedICP: ICPDefinition;
  matchScore: number; // 0-100
  matchReason: string;
  timestamp: string;
}

/**
 * Defined ICPs for DealFlow.ai
 */
export const ICP_DEFINITIONS: ICPDefinition[] = [
  {
    id: "enterprise-saas",
    name: "Enterprise SaaS Profile",
    description: "High-volume enterprise SaaS companies with 500+ employees",
    targetIndustries: ["SaaS", "Enterprise Software", "Cloud Computing", "Tech"],
    targetCompanySizes: ["500-1000", "501-1000", "1000+", "10000+"],
    targetRevenueRanges: ["$50M-$100M", "$100M+"],
    suitabilityCriteria: (data) => Boolean(data.companySize?.includes("50") || data.revenue?.includes("100M")),
    documentUrl: "/docs/icps/enterprise-saas-blueprint.pdf"
  },
  {
    id: "mid-market-ecom",
    name: "Mid-Market E-commerce",
    description: "Established e-commerce brands scaling their outbound operations.",
    targetIndustries: ["E-commerce", "Retail", "Consumer Goods"],
    targetCompanySizes: ["51-200", "201-500"],
    targetRevenueRanges: ["$10M - $50M", "$50M - $100M"],
    suitabilityCriteria: (data) => {
      const industry = data.industry?.toLowerCase() || "";
      const isEcom = industry.includes("e-commerce") || industry.includes("retail") || industry.includes("consumer");
      return isEcom;
    },
    documentUrl: "/docs/icp/mid-market-ecom-scaling.pdf"
  },
  {
    id: "smb-agencies",
    name: "SMB Agencies",
    description: "Service-based agencies looking to automate lead follow-up.",
    targetIndustries: ["Marketing", "Advertising", "Agencies", "Consulting"],
    targetCompanySizes: ["1-10", "11-50"],
    targetRevenueRanges: ["$0 - $1M", "$1M - $5M", "$5M - $10M"],
    suitabilityCriteria: (data) => {
      const industry = data.industry?.toLowerCase() || "";
      const isAgency = industry.includes("agency") || industry.includes("consulting") || industry.includes("marketing");
      return isAgency;
    },
    documentUrl: "/docs/icp/agency-automation-guide.pdf"
  }
];

/**
 * Logic to select the best matching ICP for a company
 */
export function matchICP(data: Partial<LeadRecord | IntakeFormData>): ICPMatchResult | null {

  try {
    let bestMatch: ICPDefinition | null = null;
    let maxScore = -1;

    for (const icp of ICP_DEFINITIONS) {
      let score = 0;
      
      // Industry match
      if (icp.targetIndustries.some(ind => data.industry?.toLowerCase().includes(ind.toLowerCase()))) {
        score += 40;
      }

      // Company size match
      if (icp.targetCompanySizes.includes(data.companySize || "")) {
        score += 30;
      }

      // Revenue match
      if (icp.targetRevenueRanges.includes(data.revenue || "")) {
        score += 30;
      }

      // Criteria check
      if (icp.suitabilityCriteria(data)) {
        score += 20; // Bonus for suitability
      }

      if (score > maxScore && score >= 50) {
        maxScore = score;
        bestMatch = icp;
      }
    }

    if (!bestMatch) return null;

    return {
      leadId: (data as LeadRecord).id || "temp-lead",
      companyName: data.companyName || "Unknown Company",
      matchedICP: bestMatch,
      matchScore: Math.min(100, maxScore),
      matchReason: `Matched based on industry (${data.industry || 'General'}) and company profile.`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("[ICPMatch] Error matching ICP:", error);
    return null;
  }
}

/**
 * Simulates distribution of ICP documents
 */
export async function distributeICPDocument(match: ICPMatchResult): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[ICPDistribution] Distributing ${match.matchedICP.name} document to ${match.companyName}...`);
    
    // In a real implementation, this would trigger an email or portal update
    // e.g., await sendEmailWithAttachment(match.matchedICP.documentUrl, ...)
    
    return {
      success: true,
      message: `Successfully distributed ${match.matchedICP.name} documentation to ${match.companyName}.`
    };
  } catch (error: any) {
    console.error("[ICPDistribution] Error distributing document:", error);
    return {
      success: false,
      message: `Failed to distribute documentation: ${error.message}`
    };
  }
}
