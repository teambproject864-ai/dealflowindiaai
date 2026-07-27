"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, File, X, CheckCircle2, ChevronRight } from "lucide-react";

const REGION_OPTIONS = [
  "North America",
  "Europe",
  "United Kingdom",
  "APAC",
  "Middle East",
  "LATAM",
  "Africa",
  "Global"
];

export default function GtmAssessmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [productOwnerName, setProductOwnerName] = useState("");
  const [productOwnerEmail, setProductOwnerEmail] = useState("");
  const [targetLaunchDate, setTargetLaunchDate] = useState("");
  const [targetMarketRegion, setTargetMarketRegion] = useState("");
  const [primaryUseCase, setPrimaryUseCase] = useState("");
  const [marketingBudgetAllocation, setMarketingBudgetAllocation] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Validation & Submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Client-Side Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    }

    if (!productOwnerName.trim()) {
      newErrors.productOwnerName = "Product owner name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!productOwnerEmail.trim()) {
      newErrors.productOwnerEmail = "Product owner email is required";
    } else if (!emailRegex.test(productOwnerEmail)) {
      newErrors.productOwnerEmail = "Invalid email address format";
    }

    if (!targetLaunchDate.trim()) {
      newErrors.targetLaunchDate = "Target launch date is required";
    } else if (isNaN(Date.parse(targetLaunchDate))) {
      newErrors.targetLaunchDate = "Invalid date format";
    }

    if (!targetMarketRegion) {
      newErrors.targetMarketRegion = "Target market region is required";
    }

    if (!primaryUseCase.trim()) {
      newErrors.primaryUseCase = "Primary product use case is required";
    }

    const budgetNum = Number(marketingBudgetAllocation);
    if (!marketingBudgetAllocation.trim()) {
      newErrors.marketingBudgetAllocation = "Marketing budget allocation is required";
    } else if (isNaN(budgetNum) || budgetNum < 0) {
      newErrors.marketingBudgetAllocation = "Budget allocation must be a non-negative number";
    }

    if (!stakeholders.trim()) {
      newErrors.stakeholders = "Cross-functional stakeholder list is required";
    }

    if (uploadedFiles.length === 0) {
      newErrors.complianceDocuments = "At least one compliance document must be uploaded";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setApiError(null);

    const submissionData = {
      productName,
      productOwnerName,
      productOwnerEmail,
      targetLaunchDate,
      targetMarketRegion,
      primaryUseCase,
      marketingBudgetAllocation,
      stakeholders,
      complianceDocuments: uploadedFiles,
    };

    try {
      const res = await fetch("/api/gtm-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setTrackingId(result.trackingId);
      } else {
        setApiError(result.error || "Failed to process GTM assessment submission");
      }
    } catch (err) {
      console.error(err);
      setApiError("Network error. Please verify database connectivity.");
    } finally {
      setSubmitting(false);
    }
  };

  // PDF / Print Record Generation
  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GTM Assessment Record - ${productName}</title>
            <style>
              body {
                font-family: Georgia, serif;
                padding: 40px;
                color: #111;
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.6;
              }
              h1 {
                font-size: 28px;
                border-bottom: 2px solid #222;
                padding-bottom: 12px;
                margin-bottom: 24px;
                font-weight: normal;
              }
              .meta-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              .meta-table th, .meta-table td {
                text-align: left;
                padding: 10px;
                border-bottom: 1px solid #ddd;
              }
              .meta-table th {
                width: 30%;
                font-weight: bold;
                color: #555;
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-top: 30px;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #333;
              }
              .value-box {
                background: #f9f9f9;
                border-left: 3px solid #8a704c;
                padding: 15px;
                font-size: 14px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <h1>Go-to-Market Assessment Record</h1>
            <table class="meta-table">
              <tr><th>Tracking ID</th><td><strong>${trackingId}</strong></td></tr>
              <tr><th>Product Name</th><td>${productName}</td></tr>
              <tr><th>Product Owner</th><td>${productOwnerName}</td></tr>
              <tr><th>Owner Email</th><td>${productOwnerEmail}</td></tr>
              <tr><th>Target Launch Date</th><td>${targetLaunchDate}</td></tr>
              <tr><th>Target Market Region</th><td>${targetMarketRegion}</td></tr>
              <tr><th>Marketing Budget</th><td>$${Number(marketingBudgetAllocation).toLocaleString()} USD</td></tr>
              <tr><th>Stakeholders</th><td>${stakeholders}</td></tr>
              <tr><th>Compliance Documents</th><td>${uploadedFiles.join(', ') || 'None'}</td></tr>
              <tr><th>Submitted At</th><td>${new Date().toLocaleString()}</td></tr>
            </table>
            
            <div class="section-title">Primary Use Case</div>
            <div class="value-box">${primaryUseCase}</div>
            
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleResetForm = () => {
    setProductName("");
    setProductOwnerName("");
    setProductOwnerEmail("");
    setTargetLaunchDate("");
    setTargetMarketRegion("");
    setPrimaryUseCase("");
    setMarketingBudgetAllocation("");
    setStakeholders("");
    setUploadedFiles([]);
    setTrackingId(null);
    setErrors({});
    setApiError(null);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f3f0] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl rounded-lg border border-[#24252a] bg-[#111219]/60 p-6 md:p-8 relative overflow-hidden">
        
        {/* Header Section */}
        <div className="mb-8 border-b border-[#24252a]/60 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c]">
            Go-To-Market Process
          </p>
          <h2 className="text-2xl font-display font-light text-white tracking-tight mt-1">
            Go-to-Market Assessment
          </h2>
        </div>

        {apiError && (
          <div role="alert" className="bg-rose-950/20 border border-rose-800/40 p-4 mb-6 rounded-md text-xs text-rose-350">
            <p className="font-semibold text-rose-455 mb-1">Submission Error</p>
            <p>{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8a704c] border-b border-[#24252a]/40 pb-2">
            Assessment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-xs font-semibold text-slate-355">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Acme Pipeline Agent"
                className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
              />
              {errors.productName && (
                <p role="alert" className="text-xs text-red-400 font-light">{errors.productName}</p>
              )}
            </div>

            {/* Product Owner Name */}
            <div className="space-y-2">
              <Label htmlFor="productOwnerName" className="text-xs font-semibold text-slate-355">Product Owner Name</Label>
              <Input
                id="productOwnerName"
                value={productOwnerName}
                onChange={(e) => setProductOwnerName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
              />
              {errors.productOwnerName && (
                <p role="alert" className="text-xs text-red-400 font-light">{errors.productOwnerName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Owner Email */}
            <div className="space-y-2">
              <Label htmlFor="productOwnerEmail" className="text-xs font-semibold text-slate-355">Product Owner Email</Label>
              <Input
                id="productOwnerEmail"
                type="text"
                value={productOwnerEmail}
                onChange={(e) => setProductOwnerEmail(e.target.value)}
                placeholder="sarah@company.com"
                className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
              />
              {errors.productOwnerEmail && (
                <p role="alert" className="text-xs text-red-400 font-light">{errors.productOwnerEmail}</p>
              )}
            </div>

            {/* Target Launch Date */}
            <div className="space-y-2">
              <Label htmlFor="targetLaunchDate" className="text-xs font-semibold text-slate-355">Target Launch Date</Label>
              <Input
                id="targetLaunchDate"
                type="date"
                value={targetLaunchDate}
                onChange={(e) => setTargetLaunchDate(e.target.value)}
                className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
              />
              {errors.targetLaunchDate && (
                <p role="alert" className="text-xs text-red-400 font-light">{errors.targetLaunchDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Market Region */}
            <div className="space-y-2">
              <Label htmlFor="targetMarketRegion" className="text-xs font-semibold text-slate-355">Target Market Region</Label>
              <select
                id="targetMarketRegion"
                value={targetMarketRegion}
                onChange={(e) => setTargetMarketRegion(e.target.value)}
                className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10 w-full px-3 text-sm"
              >
                <option value="" disabled>Select region...</option>
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.targetMarketRegion && (
                <p role="alert" className="text-xs text-red-400 font-light">{errors.targetMarketRegion}</p>
              )}
            </div>

            {/* Marketing Budget Allocation */}
            <div className="space-y-2">
              <Label htmlFor="marketingBudgetAllocation" className="text-xs font-semibold text-slate-355">Marketing Budget Allocation (USD)</Label>
              <Input
                id="marketingBudgetAllocation"
                type="number"
                value={marketingBudgetAllocation}
                onChange={(e) => setMarketingBudgetAllocation(e.target.value)}
                placeholder="50000"
                className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
              />
              {errors.marketingBudgetAllocation && (
                <p role="alert" className="text-xs text-red-400 font-light">{errors.marketingBudgetAllocation}</p>
              )}
            </div>
          </div>

          {/* Primary Product Use Case */}
          <div className="space-y-2">
            <Label htmlFor="primaryUseCase" className="text-xs font-semibold text-slate-355">Primary Product Use Case</Label>
            <Textarea
              id="primaryUseCase"
              value={primaryUseCase}
              onChange={(e) => setPrimaryUseCase(e.target.value)}
              placeholder="Describe the primary use case and core target users..."
              className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors min-h-[80px]"
            />
            {errors.primaryUseCase && (
              <p role="alert" className="text-xs text-red-400 font-light">{errors.primaryUseCase}</p>
            )}
          </div>

          {/* Cross-functional Stakeholder List */}
          <div className="space-y-2">
            <Label htmlFor="stakeholders" className="text-xs font-semibold text-slate-355">Cross-functional Stakeholders (comma separated)</Label>
            <Input
              id="stakeholders"
              value={stakeholders}
              onChange={(e) => setStakeholders(e.target.value)}
              placeholder="Sarah (Product), David (Sales), Helen (Legal)"
              className="bg-[#16181f] border-[#24252a] text-[#f4f3f0] placeholder-slate-500 focus:border-[#d4a017] focus:ring-0 rounded-md transition-colors h-10"
            />
            {errors.stakeholders && (
              <p role="alert" className="text-xs text-red-400 font-light">{errors.stakeholders}</p>
            )}
          </div>

          {/* Compliance Documentation Upload field */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-355">Compliance Documentation</Label>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#24252a] hover:border-[#8a704c] bg-[#16181f]/40 rounded-lg p-6 text-center cursor-pointer transition-colors"
            >
              <Upload className="mx-auto h-7 w-7 text-[#d4a017] mb-2" />
              <p className="text-xs font-semibold text-white">Drag & drop or click to upload compliance documents</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX up to 50MB</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="sr-only"
              />
            </div>
            {errors.complianceDocuments && (
              <p role="alert" className="text-xs text-red-400 font-light mt-1">{errors.complianceDocuments}</p>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto pr-1">
                {uploadedFiles.map((docName, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#16181f] border border-[#24252a] rounded px-3 py-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <File className="h-3.5 w-3.5 text-[#d4a017] flex-shrink-0" />
                      <span className="truncate">{docName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUploadedFile(idx);
                      }}
                      className="text-slate-500 hover:text-red-400 p-0.5 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#24252a]/60 flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#d4a017] hover:bg-[#c29014] text-[#090a0f] rounded-md font-semibold px-6 h-10 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Assessment <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {trackingId && (
            <div className="fixed inset-0 z-50 bg-[#090a0f]/85 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111219] border border-[#24252a] p-8 rounded-lg max-w-lg w-full space-y-6 shadow-2xl relative"
              >
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-[#d4a017] mx-auto mb-4" />
                  <h3 className="text-xl font-display font-light text-white">Go-to-Market Assessment Submitted</h3>
                  <p className="text-xs text-slate-400 mt-1">Your tracking ID has been generated successfully.</p>
                </div>

                <div className="border border-[#24252a] rounded-md p-4 bg-[#16181f]/60 space-y-3">
                  <div className="flex justify-between border-b border-[#24252a]/60 pb-2">
                    <span className="text-xs text-slate-400">Tracking ID</span>
                    <span className="text-xs font-mono font-bold text-[#d4a017]">{trackingId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Product</span>
                    <span className="text-white font-medium">{productName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Owner</span>
                    <span className="text-white font-medium">{productOwnerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Launch Date</span>
                    <span className="text-white font-medium">{targetLaunchDate}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Region</span>
                    <span className="text-white font-medium">{targetMarketRegion}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownloadPdf}
                    className="flex-1 bg-transparent hover:bg-white/5 border border-[#24252a] text-white rounded-md text-xs font-semibold h-10"
                  >
                    Download PDF Record
                  </Button>
                  <Button
                    onClick={handleResetForm}
                    className="flex-1 bg-[#d4a017] hover:bg-[#c29014] text-[#090a0f] rounded-md text-xs font-semibold h-10"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

