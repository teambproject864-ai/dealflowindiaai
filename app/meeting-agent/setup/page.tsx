"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PERSONAS } from "@/prompts/personas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { isValidMeetingUrl } from "@/lib/meeting-utils";
import { v4 as uuidv4 } from "uuid";

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get("leadId");

  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState("praneeth_assist");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [callId, setCallId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const id = leadId;
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/leads/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLeadData(data);
          }
        }
      } catch (err) {
        console.error("Error loading lead data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [leadId]);

  const handleActivate = async () => {
    if (!meetingUrl) return setUrlError("Please enter a meeting URL");
    if (!isValidMeetingUrl(meetingUrl)) return setUrlError("Please enter a valid URL (e.g. https://zoom.us/...)");
    
    setIsActivating(true);
    setUrlError("");
    const newCallId = uuidv4();
    setCallId(newCallId);

    try {
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0F1E]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] max-w-2xl mx-auto mt-20 p-6 text-center">
        <Card className="p-12 border-2 border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-white">Agent Activated!</h1>
          <p className="text-muted-foreground mb-8">
            Your AI agent is ready to join the meeting.
          </p>
          <Button asChild size="lg" className="w-full bg-violet-600 hover:bg-violet-700">
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-5 w-5" />
              Join Meeting Now
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2 text-white">Configure AI Meeting Agent</h1>
        <p className="text-xl text-muted-foreground">
          Setup the AI persona and meeting details for {leadData?.companyName || "your meeting"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-white">Select Agent Persona</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PERSONAS).map(([key, p]) => (
                <Card
                  key={key}
                  onClick={() => setSelectedPersona(key)}
                  className={`p-6 cursor-pointer transition-all border-2 bg-white/5 ${
                    selectedPersona === key ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-violet-500/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{(p as any).name}</h3>
                      <p className="text-sm text-violet-400 font-medium">{(p as any).role}</p>
                    </div>
                    {selectedPersona === key && <Badge className="bg-violet-600">Selected</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {key === "praneeth_assist" && "Warm, consultative, relationship-focused. Best for discovery."}
                    {key === "alex" && "Technical, precise, implementation-focused. Best for technical deep-dives."}
                    {key === "sam" && "Authoritative, executive-level, strategic. Best for enterprise deals."}
                    {key === "jordan" && "Friendly, deal-oriented, negotiation-focused. Best for closing."}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">Meeting Details</h2>
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="space-y-4">
                <label className="text-sm font-medium text-white">Meeting URL (Zoom, Google Meet, or Teams)</label>
                <Input
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingUrl}
                  onChange={(e) => {
                    setMeetingUrl(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                  className={`h-12 bg-white/5 border-white/10 text-white ${urlError ? "border-red-500" : ""}`}
                />
                {urlError && (
                  <p className="text-xs text-red-500 flex items-center">
                    <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                    {urlError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your AI agent will join this link 1-2 minutes after activation.
                </p>
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-muted-foreground">Lead Context</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Company</label>
                <p className="font-semibold text-white">{leadData?.companyName || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Lead ID</label>
                <p className="font-mono text-[10px] break-all text-white">{leadId || "N/A"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Contact</label>
                <p className="font-semibold text-white">{leadData?.contactName || "N/A"}</p>
                <p className="text-xs text-muted-foreground">{leadData?.contactEmail || ""}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Challenges</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {leadData?.challenges?.map((c: string, i: number) => (
                    <Badge key={i} className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleActivate}
            disabled={isActivating || !meetingUrl}
            className="w-full h-16 text-lg font-bold shadow-xl shadow-violet-600/20 bg-violet-600 hover:bg-violet-700"
          >
            {isActivating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate AI Agent"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MeetingAgentSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
    </div>}>
      <SetupContent />
    </Suspense>
  );
}
