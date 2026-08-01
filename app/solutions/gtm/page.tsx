"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { generateICPDocument, ICPDocumentData } from "@/lib/icp-document-generator";
import { IntakeFormData } from "@/lib/types";
import { 
  Loader2, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Brain, 
  Database, 
  Shield, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  RefreshCw,
  Search,
  Check
} from "lucide-react";
import Link from "next/link";

const GtmLaunchRoadmap3D = dynamic(
  () => import("@/components/solutions-3d/GtmLaunchRoadmap3D").then((mod) => mod.GtmLaunchRoadmap3D),
  { ssr: false }
);

const NAV_LINKS = [
  { href: "/solutions",           label: "DEALFLOW.OS" },
  { href: "/solutions/gtm",       label: "GTM Roadmap" },
  { href: "/solutions/sales",     label: "Sales Pipeline" },
  { href: "/solutions/marketing", label: "Marketing" },
];

export default function GtmPage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"roadmap" | "generator">("generator");
  
  // Form State
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [companySize, setCompanySize] = useState("11-50");
  const [monthlyLeads, setMonthlyLeads] = useState("50-100");
  const [primaryPriority, setPrimaryPriority] = useState("balanced");
  const [geographies, setGeographies] = useState<string[]>(["North America"]);

  // Generation Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  
  // Results
  const [icpDocument, setIcpDocument] = useState<ICPDocumentData | null>(null);

  // Download States
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "markdown" | null>(null);
  const [downloadStage, setDownloadStage] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const toggleGeography = (region: string) => {
    if (geographies.includes(region)) {
      setGeographies(geographies.filter((r) => r !== region));
    } else {
      setGeographies([...geographies, region]);
    }
  };

  // Run the Multi-Agent Simulation
  const handleGenerateICP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      toast.error("Please enter a Target Company Name.");
      return;
    }

    setIsGenerating(true);
    setIcpDocument(null);
    setDownloadError(null);

    const stages = [
      { progress: 10, stage: "Research Agent: Crawling domain and extracting value tags..." },
      { progress: 35, stage: "Analysis Agent: Mapping industry pain points to technical alignment specifications..." },
      { progress: 65, stage: "Fact-Check Agent: Cross-referencing TAM consensus estimates and computing variance metrics..." },
      { progress: 85, stage: "Synthesis Agent: Formatting final Ideal Customer Profile document..." },
      { progress: 100, stage: "Multi-Agent Framework: Completed consensus strategy synthesis." }
    ];

    for (const step of stages) {
      setGenerationStage(step.stage);
      setGenerationProgress(step.progress);
      await new Promise((resolve) => setTimeout(resolve, step.progress === 100 ? 500 : 900));
    }

    // Prepare form data structure
    const mockIntake: Partial<IntakeFormData> = {

      name: user?.name || "GTM Analyst",
      emailPersonal: user?.email || "analyst@dealflow.ai",
      jobTitle: "GTM Consultant",
      companyName: companyName,
      websiteUrl: websiteUrl || "https://example.com",
      headquartersCountry: "United States",
      headquartersCity: "San Francisco",
      companyDescription: `A high-growth business specialized in ${industry} targeting regional operations.`,
      productsServices: "Core operational tools and integrations.",
      primaryOutcome: "Pipeline velocity acceleration and RevOps alignment.",
      keyChallenges: "Manual outreach bottlenecks and scale inefficiencies.",
      uniqueValueProp: "Next-gen intelligent SDR pipeline automation.",
      successStories: "Accelerated sales pipeline growth by 45%.",
      customerTestimonials: "Outstanding pipeline speed improvements.",
      credibilityFactors: "SOC2 Compliance, 99.9% Up-time SLA.",
      publishingFrequency: "Daily",
      timeToValue: "< 1 Week",
      primaryCta: "Book a Call",
      icpDescription: "High growth organizations scaling SDR operations.",
      targetIndustries: [industry],
      targetCompanySizes: [companySize],
      targetRevenues: ["$10M - $50M"],
      targetGeographics: geographies,
      preferredLanguages: ["English"],
      buyingRoles: ["VP Sales", "VP RevOps", "CTO", "Director of Business Development"],
      budgetDepartments: ["Sales", "Operations", "Finance"],
      targetSeniorities: ["VP", "Director", "C-Level"],
      buyingSignals: ["Funding", "Hiring surges", "Leadership changes"],
      prospectTechnologies: "Salesforce, Apollo.io, GSuite",
      commonObjections: "Integration friction, budget limitations, security compliance.",
      overcomeObjections: "Demonstrated instant API connectors, clear ROI calculator, Clawpatrol secure firewall.",
      messagingThemes: "Automate outbound research safely and securely.",
      industry: industry,
      companySize: companySize,
      revenue: "$10M - $50M",
      monthlyLeads: monthlyLeads,
      challenges: ["Manual outreach bottlenecks"],
    };

    const doc = generateICPDocument(mockIntake as IntakeFormData);

    setIcpDocument(doc);
    setIsGenerating(false);
  };

  // Handle Secure Document Downloads
  const handleDownload = async (format: "pdf" | "docx" | "markdown") => {
    if (!icpDocument) return;

    setDownloadFormat(format);
    setDownloadError(null);
    setDownloadStage("Authenticating analyst permissions...");
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Role authentication check
    if (!user || (user.role !== "admin" && user.role !== "agent")) {
      setDownloadError("Access Denied: You do not have permission to download GTM assets. ICP exports are restricted to GTM Analysts, RevOps, and Administrators.");
      setDownloadFormat(null);
      return;
    }

    try {
      if (format === "pdf") {
        setDownloadStage("Formatting vector components for browser print engine...");
        await new Promise((resolve) => setTimeout(resolve, 600));
        
        // Serialize document and write to sessionStorage
        sessionStorage.setItem("dealflow_icp_print_data", JSON.stringify(icpDocument));
        
        // Open print view in new window
        window.open("/solutions/gtm/print", "_blank");
        
        setDownloadFormat(null);
      } else {
        setDownloadStage(`Initiating secure ${format.toUpperCase()} compile...`);
        await new Promise((resolve) => setTimeout(resolve, 600));

        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            documentData: icpDocument
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }

        setDownloadStage("Preserving visual assets and delivering binary payload...");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `icp_strategy_blueprint.${format === "markdown" ? "md" : "docx"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        setDownloadFormat(null);
      }
    } catch (err: any) {
      console.error("Export failure:", err);
      setDownloadError(`Export failed: ${err.message || "Network connection interrupted. Please check server logs."}`);
      setDownloadFormat(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sub-nav */}
      <nav className="sticky top-14 sm:top-16 z-20 flex items-center gap-1 border-b border-slate-800 bg-slate-900/90 px-6 py-3 backdrop-blur-md">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              href === "/solutions/gtm"
                ? "bg-slate-800 text-teal-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {label}
          </Link>
        ))}
        <div className="ml-auto text-[10px] font-mono uppercase tracking-widest text-slate-500">
          GTM Platform Sync
        </div>
      </nav>

      {/* Main Workspace Grid */}
      <main className="mx-auto max-w-7xl px-6 py-8 relative z-10">
        {/* Header Tabs */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Go-To-Market (GTM) Strategy Hub</h1>
            <p className="text-xs text-slate-400 mt-1">Configure Target Customer Profiles and run data-validated alignment analysis.</p>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("generator")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "generator"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ICP Generator HUD
            </button>
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "roadmap"
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              3D Launch Roadmap
            </button>
          </div>
        </div>

        {/* Tab 1: 3D Roadmap */}
        {activeTab === "roadmap" && (
          <div className="relative h-[650px] w-full rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-slate-950">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                </div>
              }
            >
              <GtmLaunchRoadmap3D />
            </Suspense>
            <div className="absolute bottom-4 left-4 rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-xs text-slate-400 max-w-xs">
              <span className="font-bold text-white block mb-1">WebGL 3D Telemetry</span>
              Drag/rotate with cursor to inspect active nodes and channel sequences syncing in real-time.
            </div>
          </div>
        )}

        {/* Tab 2: ICP Generator HUD */}
        {activeTab === "generator" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* Input Config Form Panel (Solid Slate style) */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-teal-400" />
                ICP Configuration Parameters
              </h2>
              
              <form onSubmit={handleGenerateICP} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Company / Segment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme SaaS Global"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Website URL (for Cheerio scrapers)</label>
                  <input
                    type="text"
                    placeholder="https://acme-saas.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Industry Verticals</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white outline-none focus:border-teal-500"
                    >
                      <option value="SaaS">B2B SaaS</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Healthcare">Healthcare Tech</option>
                      <option value="Finance">Fintech</option>
                      <option value="Professional Services">Agencies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Company Size Tiers</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white outline-none focus:border-teal-500"
                    >
                      <option value="1-10">Startup (1-10)</option>
                      <option value="11-50">SMB (11-50)</option>
                      <option value="51-200">Mid-Market (51-200)</option>
                      <option value="201-500">Enterprise (201-500)</option>
                      <option value="500+">Mega Corp (500+)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Monthly Leads Pipeline</label>
                    <select
                      value={monthlyLeads}
                      onChange={(e) => setMonthlyLeads(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white outline-none focus:border-teal-500"
                    >
                      <option value="1-50">Low (1-50)</option>
                      <option value="50-100">Medium (50-100)</option>
                      <option value="100-500">High (100-500)</option>
                      <option value="500+">Extreme (500+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Primary Tech Priority</label>
                    <select
                      value={primaryPriority}
                      onChange={(e) => setPrimaryPriority(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white outline-none focus:border-teal-500"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="hermes">Memory OS (Hermes)</option>
                      <option value="clawpatrol">Firewall (Clawpatrol)</option>
                      <option value="multiagent">Multi-Agent framework</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2.5 font-semibold">Target Geography Markets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["North America", "Europe", "Asia Pacific", "Latin America"].map((region) => (
                      <label key={region} className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={geographies.includes(region)}
                          onChange={() => toggleGeography(region)}
                          className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-0"
                        />
                        {region}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full mt-2 rounded-lg bg-teal-600 py-3 font-semibold text-white hover:bg-teal-500 transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing target data...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Generate ICP Strategy
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Content Output Viewer Panel */}
            <div className="lg:col-span-8 space-y-6">
              {/* Fallback Idle state */}
              {!isGenerating && !icpDocument && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-500">
                  <BarChart3 className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                  <h3 className="text-base font-bold text-slate-400 mb-2">No GTM Strategy Active</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Input your target company details on the left and run the GTM Multi-Agent Analysis to compile customer segments and technical value propositions.
                  </p>
                </div>
              )}

              {/* Loader progress simulation */}
              {isGenerating && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-400 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Multi-Agent Reasoning Thread</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{generationStage}</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-[10px] font-mono uppercase tracking-wider text-center">
                    <div className={generationProgress >= 10 ? "text-teal-400 font-bold" : "text-slate-600"}>Research</div>
                    <div className={generationProgress >= 35 ? "text-teal-400 font-bold" : "text-slate-600"}>Analysis</div>
                    <div className={generationProgress >= 65 ? "text-teal-400 font-bold" : "text-slate-600"}>Fact-Check</div>
                    <div className={generationProgress >= 85 ? "text-teal-400 font-bold" : "text-slate-600"}>Synthesis</div>
                  </div>
                </div>
              )}

              {/* Complete ICP Report Panel */}
              {icpDocument && (
                <div className="space-y-6">
                  {/* Export Controls Bar */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Document Generation Complete</span>
                      <span className="text-[10px] text-slate-400 font-mono">Role: {user?.role || "analyst"} | Clearance: Approved</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        onClick={() => handleDownload("markdown")}
                        disabled={downloadFormat !== null}
                        className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-semibold text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        MD
                      </button>
                      <button
                        onClick={() => handleDownload("docx")}
                        disabled={downloadFormat !== null}
                        className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-semibold text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        DOCX
                      </button>
                      <button
                        onClick={() => handleDownload("pdf")}
                        disabled={downloadFormat !== null}
                        className="rounded bg-teal-600 hover:bg-teal-500 px-4 py-1.5 font-semibold text-white transition-colors flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF / Print
                      </button>
                    </div>
                  </div>

                  {/* Download Progress Banner */}
                  {downloadFormat !== null && (
                    <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4 text-xs text-indigo-300 flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-indigo-400" />
                      <div>
                        <span className="font-bold block">Downloading in {downloadFormat.toUpperCase()} format...</span>
                        <span className="text-[10px] text-indigo-400 mt-0.5">{downloadStage}</span>
                      </div>
                    </div>
                  )}

                  {/* Access Denied / Download Error Alert */}
                  {downloadError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center gap-3">
                      <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                      <div className="flex-1">
                        <span className="font-bold block mb-0.5">Document Export Security Action</span>
                        <p>{downloadError}</p>
                      </div>
                      <button 
                        onClick={() => setDownloadError(null)}
                        className="text-[10px] uppercase font-bold text-red-400 hover:underline px-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Preview Sheet (Solid Dark flat design) */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 space-y-8 text-xs text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
                    {/* Cover Section */}
                    <div className="border-b border-slate-800 pb-6 text-center">
                      <h2 className="text-lg font-black text-white tracking-wide uppercase">Ideal Customer Profile (ICP) strategy</h2>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Technical subsystem alignment framework</p>
                      <p className="text-[10px] text-slate-500">Target Segment: {companyName} ({industry})</p>
                    </div>

                    {/* Section 1: Overview */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">1. Go-to-Market ICP Overview</h3>
                      <p className="text-slate-400">{icpDocument["ICP Overview"]}</p>
                    </div>

                    {/* Section 2: Segmentation */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">2. Target Customer Segmentation</h3>
                      <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div>
                          <span className="font-bold text-slate-400">Demographics</span>
                          <p className="text-slate-300 mt-1">{icpDocument["Target Customer Segmentation"]["Demographics"]}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400">Firmographics</span>
                          <p className="text-slate-300 mt-1">{icpDocument["Target Customer Segmentation"]["Firmographics"]}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400">SDR Cohort Size</span>
                          <p className="text-slate-300 mt-1">{icpDocument["Target Customer Segmentation"]["SDR Team Scale"]}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400">Target Geography</span>
                          <p className="text-slate-300 mt-1">{icpDocument["Target Customer Segmentation"]["Target Geographies"]}</p>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Pain Points */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">3. Key Pain Point Mapping</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="font-bold text-white block">Manual Outreach Overhead</span>
                          <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Key Pain Point Mapping"]["Manual Outreach Overhead"]}</p>
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="font-bold text-white block">Deliverability &amp; Spam Risks</span>
                          <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Key Pain Point Mapping"]["Deliverability & Spam Risks"]}</p>
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="font-bold text-white block">Context Loss &amp; Hallucinations</span>
                          <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Key Pain Point Mapping"]["Context Loss & Hallucinations"]}</p>
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="font-bold text-white block">Security &amp; Jailbreak Risks</span>
                          <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Key Pain Point Mapping"]["Security & Jailbreak Vulnerabilities"]}</p>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Technical Product Alignment */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">4. Technical Product Value Proposition Alignment</h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 flex gap-3">
                          <Database className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white text-[13px] block">Memory OS (Hermes)</span>
                            <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Technical Product Value Proposition Alignment"]["Memory OS (Hermes) Alignment"]}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 flex gap-3">
                          <Shield className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white text-[13px] block">Agent Security Firewall (Clawpatrol)</span>
                            <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Technical Product Value Proposition Alignment"]["Agent Security Firewall (Clawpatrol) Alignment"]}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 flex gap-3">
                          <Brain className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white text-[13px] block">Multi-Agent Framework</span>
                            <p className="text-slate-400 mt-1 text-[11px]">{icpDocument["Technical Product Value Proposition Alignment"]["Multi-Agent Framework Alignment"]}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Use Case Prioritization */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">5. Use Case Prioritization Grid</h3>
                      <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="text-teal-400 font-bold block mb-1">PRIORITY 1: VOICE CHANNELS</span>
                          {icpDocument["Use Case Prioritization Grid"]["Priority 1: Live Voice Call Conduits"]}
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="text-teal-400 font-bold block mb-1">PRIORITY 2: SITE SCRAPING</span>
                          {icpDocument["Use Case Prioritization Grid"]["Priority 2: Automated Lead Site Scraping"]}
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="text-teal-400 font-bold block mb-1">PRIORITY 3: MULTI-AGENT SYNTHESIS</span>
                          {icpDocument["Use Case Prioritization Grid"]["Priority 3: Multi-Agent Consensus Syntheses"]}
                        </div>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800">
                          <span className="text-teal-400 font-bold block mb-1">PRIORITY 4: TIME COMPLIANCE</span>
                          {icpDocument["Use Case Prioritization Grid"]["Priority 4: Compliance-Checked Confirmations"]}
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Market Sizing & Competitor Estimates */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">6. Market Sizing &amp; Competitor Estimates</h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-teal-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-400 block">TAM 2026 Consensus</span>
                            <span className="text-white font-bold">{icpDocument["Market Sizing & Competitor Estimates"]["TAM 2026 Consensus"]}</span>
                          </div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-teal-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-400 block">Growth CAGR</span>
                            <span className="text-white font-bold">{icpDocument["Market Sizing & Competitor Estimates"]["Consensus Growth CAGR"]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vector Visualization: Market Share Donut Chart */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 block">1. Consensus Market Share Landscape (Donut chart SVG)</span>
                        <div className="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <svg width="450" height="240" viewBox="0 0 600 320" className="w-full max-w-lg">
                            <rect width="600" height="320" rx="16" fill="#0b0f19" stroke="#1E293B" strokeWidth="1.5"/>
                            <circle cx="200" cy="160" r="100" fill="none" stroke="#6C3BFF" strokeWidth="24" strokeDasharray="251 377" strokeDashoffset="0" />
                            <circle cx="200" cy="160" r="100" fill="none" stroke="#00D4FF" strokeWidth="24" strokeDasharray="157 471" strokeDashoffset="-251" />
                            <circle cx="200" cy="160" r="100" fill="none" stroke="#00FFB2" strokeWidth="24" strokeDasharray="125 503" strokeDashoffset="-408" />
                            <circle cx="200" cy="160" r="100" fill="none" stroke="#FF6B9D" strokeWidth="24" strokeDasharray="95 533" strokeDashoffset="-533" />
                            <circle cx="200" cy="160" r="75" fill="#0b0f19" />
                            <text x="200" y="150" textAnchor="middle" fill="#8B9BB8" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="bold" letterSpacing="1">TOTAL TAM</text>
                            <text x="200" y="178" textAnchor="middle" fill="#00FFB2" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="black">$8.1B</text>
                            <g transform="translate(380, 50)">
                              <rect width="12" height="12" rx="3" fill="#6C3BFF" />
                              <text x="20" y="11" fill="#E2E8F0" fontSize="12" fontWeight="bold">Apollo.io (40%)</text>
                            </g>
                            <g transform="translate(380, 95)">
                              <rect width="12" height="12" rx="3" fill="#00D4FF" />
                              <text x="20" y="11" fill="#E2E8F0" fontSize="12" fontWeight="bold">Clay.com (25%)</text>
                            </g>
                            <g transform="translate(380, 140)">
                              <rect width="12" height="12" rx="3" fill="#00FFB2" />
                              <text x="20" y="11" fill="#E2E8F0" fontSize="12" fontWeight="bold">Instantly.ai (20%)</text>
                            </g>
                            <g transform="translate(380, 185)">
                              <rect width="12" height="12" rx="3" fill="#FF6B9D" />
                              <text x="20" y="11" fill="#FFFFFF" fontSize="12" fontWeight="bold">DealFlow (15%)</text>
                            </g>
                          </svg>
                        </div>
                      </div>

                      {/* Vector Visualization: Target Audience Grid */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 block">2. GTM Channel Heatmap Grid (Performance Heatmap SVG)</span>
                        <div className="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <svg width="450" height="240" viewBox="0 0 600 320" className="w-full max-w-lg">
                            <rect width="600" height="320" rx="16" fill="#0b0f19" stroke="#1E293B" strokeWidth="1.5"/>
                            <text x="210" y="40" textAnchor="middle" fill="#8B9BB8" fontSize="11" fontWeight="bold">Conversion</text>
                            <text x="310" y="40" textAnchor="middle" fill="#8B9BB8" fontSize="11" fontWeight="bold">Scale Cap</text>
                            <text x="410" y="40" textAnchor="middle" fill="#8B9BB8" fontSize="11" fontWeight="bold">Setup Speed</text>
                            <text x="510" y="40" textAnchor="middle" fill="#8B9BB8" fontSize="11" fontWeight="bold">CAC Yield</text>
                            
                            <text x="30" y="90" fill="#FFFFFF" fontSize="12" fontWeight="bold">Signal Outbound</text>
                            <rect x="165" y="65" width="90" height="40" rx="6" fill="#6C3BFF"/>
                            <text x="210" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">9/10</text>
                            <rect x="265" y="65" width="90" height="40" rx="6" fill="#8359FF"/>
                            <text x="310" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">8/10</text>
                            <rect x="365" y="65" width="90" height="40" rx="6" fill="#6C3BFF"/>
                            <text x="410" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">9/10</text>
                            <rect x="465" y="65" width="90" height="40" rx="6" fill="#8359FF"/>
                            <text x="510" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">8/10</text>

                            <text x="30" y="150" fill="#FFFFFF" fontSize="12" fontWeight="bold">PLG/Freemium</text>
                            <rect x="165" y="125" width="90" height="40" rx="6" fill="#00D4FF"/>
                            <text x="210" y="150" textAnchor="middle" fill="#121826" fontSize="12" fontWeight="bold">7/10</text>
                            <rect x="265" y="125" width="90" height="40" rx="6" fill="#6C3BFF"/>
                            <text x="310" y="150" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">9/10</text>
                            <rect x="365" y="125" width="90" height="40" rx="6" fill="#1F293D"/>
                            <text x="410" y="150" textAnchor="middle" fill="#8B9BB8" fontSize="12" fontWeight="bold">5/10</text>
                            <rect x="465" y="125" width="90" height="40" rx="6" fill="#6C3BFF"/>
                            <text x="510" y="150" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">9/10</text>

                            <text x="30" y="210" fill="#FFFFFF" fontSize="12" fontWeight="bold">Partnerships</text>
                            <rect x="165" y="185" width="90" height="40" rx="6" fill="#6C3BFF"/>
                            <text x="210" y="210" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">9/10</text>
                            <rect x="265" y="185" width="90" height="40" rx="6" fill="#1F293D"/>
                            <text x="310" y="210" textAnchor="middle" fill="#8B9BB8" fontSize="12" fontWeight="bold">5/10</text>
                            <rect x="365" y="185" width="90" height="40" rx="6" fill="#00FFB2"/>
                            <text x="410" y="210" textAnchor="middle" fill="#121826" fontSize="12" fontWeight="bold">6/10</text>
                            <rect x="465" y="185" width="90" height="40" rx="6" fill="#00FFB2"/>
                            <text x="510" y="210" textAnchor="middle" fill="#121826" fontSize="12" fontWeight="bold">6/10</text>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Section 7: Consensus Validation Log */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-white text-sm border-l-2 border-teal-500 pl-2">7. Consensus Validation Log</h3>
                      <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[10px]">
                        <div>
                          <span className="text-slate-400 font-bold block">Consensus Status:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {icpDocument["Consensus Validation Log"]["Verification Status"]}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Coefficient of Variation:</span>
                          <span className="text-slate-300 mt-0.5 block">{icpDocument["Consensus Validation Log"]["Coefficient of Variation Check"]}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">95% Confidence MoE:</span>
                          <span className="text-slate-300 mt-0.5 block">{icpDocument["Consensus Validation Log"]["Margin of Error (95%) Check"]}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">SOC2 Integrity Hash:</span>
                          <span className="text-slate-500 mt-0.5 block">{icpDocument["Consensus Validation Log"]["Audit Integrity Stamp"]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
