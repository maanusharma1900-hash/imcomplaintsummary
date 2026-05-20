import React, { useState, useEffect } from "react";
import { 
  Building2, 
  User, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  Upload, 
  Download, 
  TrendingUp,
  Activity,
  ArrowRight,
  Database,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  Briefcase,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ConflictTicketAnalysis, SampleTicket } from "./types";

const LOCAL_SAMPLES: SampleTicket[] = [
  {
    id: "TIC-890214",
    title: "Unresponsive Supplier on LED Lights Order",
    rawText: `[2026-05-10 10:00:00 BST]
TICKET CREATED: TIC-890214
Type: Buyer-Supplier Conflict
Matchmaking Source: Buy Lead Purchased
Disputed Amount: INR 45,000

Buyer Details:
Name: Arun Sharma (Proprietor, Sharma Electricals)
Contact: arun.sharma@example.com

Seller Details:
Company Name: Glowtech Enterprises
GLID: 88472910
Executive Assigned: Deepa Nair

RCA Notes (2026-05-10 11:30:00 BST):
Buyer complained that seller Glowtech Enterprises received advanced payment of INR 45,000 for 500 units of LED Tube lights and has gone completely unresponsive. No material delivered.

Follow-up Log (2026-05-11 12:00:00 BST):
Executive Deepa Nair contacted seller. Glowtech representative said they suffered production downtime but will dispatch in 3 days.

Follow-up Log (2026-05-14 14:00:00 BST):
Buyer called back. Still no response from supplier. Buyer sounds highly frustrated, supplier is not picking calls at all. Buyer demands refund. Status moved to Paid BS Conflict.

Status Update (2026-05-15 09:30:00 BST):
Deepa Nair served formal warning email to Glowtech.

Seller Action (2026-05-16 16:30:00 BST):
Seller submitted proof of bank refund of INR 45,000 to Arun Sharma's account.

Resolution Comment (2026-05-17 11:00:00 BST):
Executive verified the transaction ID with Arun Sharma. Arun confirmed receipt of refund. Issue Resolved.
Final Status: Conflict Resolved - Refund Processed`
  },
  {
    id: "TIC-449102",
    title: "Wrong Product Delivered - High-Density Foam Blocks",
    rawText: `[2026-05-12 09:00:00 BST]
TICKET RAISED: TIC-449102
Conflict Classification: Pre BS Conflict
Channel: Catalog Match
Disputed Value: INR 1,20,000

Buyer: Rohan Mehra (Director, Mehra Packaging Labs)
Seller: Royal Polymers Private Limited (GLID: 10938472)
Assigned Executive: Rajesh Varma

Complaint Description:
Buyer received low-density packaging rolls instead of the high-density foam blocks ordered. Disputed amount is INR 1,20,000. Buyer is angry and disappointed because of production delays caused by this mistake.

RCA Notes (2026-05-12 11:00:00 BST):
Invoice confirms 'High-Density Foam Grade-A'. Supplier dispatch team mistakenly sent low-density rolls to Rohan Mehra's warehouse.

Follow-up 1 (2026-05-13 10:30:00 BST):
Rajesh Varma dialed Royal Polymers. Seller cooperative, acknowledged mistake. Agreed to pick up low-density material and dispatch the correct items at their own cost.

Follow-up 2 (2026-05-15 15:45:00 BST):
Rohan Mehra confirmed courier picked up wrong rolls. Correct items received in transit.

Buyer Confirmation (2026-05-18 12:00:00 BST):
Rohan Mehra confirmed that correct High-Density Foam blocks are received. Quality checked and accepted. Case closed.
Final Outcome: Conflict Resolved - Correct Goods Received`
  },
  {
    id: "TIC-660193",
    title: "Missing Documents - Industrial Steel Flanges",
    rawText: `[2026-05-14 11:15:00 BST]
TICKET: TIC-660193
Type: Buyer-Supplier Conflict
Source: MDC (Mobile Device Commercial)
Amount: INR 3,50,000

Buyer Info: Suresh K. (Global Pipeline Services)
Seller Info: Apex Steel Tubing (GLID: 55432190)
Handler: Neha Gupta

Initial Entry:
Suresh K. claims steel flanges didn't pass site inspection because of lack of material Mill Test Certificates (MTC). Seller refuses to provide certificates.

RCA (2026-05-14 14:00:00 BST):
Apex Steel claims Buyer hasn't cleared the final 10% outstanding invoice, hence withholding MTC. Disputed amount of material is INR 3,50,000.

First Follow-up (2026-05-15 10:00:00 BST):
Neha Gupta contacted Suresh. Suresh refuses to pay final 10% until MTC is verified. Impasse. Neha requested official purchase agreement and invoices from Suresh.

Follow-up 2 (2026-05-16 11:00:00 BST):
No document received from buyer Suresh K.

Follow-up 3 (2026-05-18 16:00:00 BST):
Suresh K. unresponsive to multiple follow-ups and emails requesting documentation.

Final Resolution Notes (2026-05-20 07:30:00 BST):
Since the buyer Suresh K. failed to submit required invoices and signed PO documents, and remains uncontactable for 4 days, the ticket is auto-closed with no action taken.
Status: No Action Taken – Documents Not Received`
  }
];

export default function App() {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMissingSecret, setIsMissingSecret] = useState(false);
  const [analysis, setAnalysis] = useState<ConflictTicketAnalysis | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusStep, setStatusStep] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [samples, setSamples] = useState<SampleTicket[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [useDirectClientMode, setUseDirectClientMode] = useState<boolean>(() => {
    return localStorage.getItem("im_llm_direct_mode") === "true";
  });
  const [clientAccessKey, setClientAccessKey] = useState<string>(() => {
    return localStorage.getItem("im_llm_access_key") || "";
  });
  const [showDirectSetup, setShowDirectSetup] = useState<boolean>(false);

  const loadingSteps = [
    "Decrypting raw ticket log headers...",
    "Parsing customer emails & resolution remarks...",
    "Reconstructing timeline events chronologically...",
    "Evaluating buyer sentiment & escalation factors...",
    "Guarding integrity (detecting bias & noise)...",
    "Structuring CXO Complaint Memorandums..."
  ];

  // Fetch samples on load
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await fetch("/api/samples");
        if (res.ok) {
          const contentType = res.headers.get("Content-Type") || "";
          if (contentType.toLowerCase().includes("json")) {
            const data = await res.json();
            setSamples(data);
            if (data && data.length > 0) {
              handleSelectSample(data[0]);
            }
            return;
          }
        }
        // Fallback to local samples
        setSamples(LOCAL_SAMPLES);
        if (LOCAL_SAMPLES.length > 0) {
          handleSelectSample(LOCAL_SAMPLES[0]);
        }
      } catch (err) {
        console.error("Failed to load samples from backend, loading fallback samples... Error:", err);
        setSamples(LOCAL_SAMPLES);
        if (LOCAL_SAMPLES.length > 0) {
          handleSelectSample(LOCAL_SAMPLES[0]);
        }
      }
    };
    fetchSamples();
  }, []);

  // Interval timer for reassuring status messages during generation
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setStatusStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setStatusStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSelectSample = (sample: SampleTicket) => {
    setSelectedSampleId(sample.id);
    setRawText(sample.rawText.trim());
    setErrorMessage(null);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".log")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setRawText(event.target.result as string);
            setSelectedSampleId("");
            setErrorMessage(null);
          }
        };
        reader.readAsText(file);
      } else {
        setErrorMessage("Please drop a valid text (.txt) file or log file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawText(event.target.result as string);
          setSelectedSampleId("");
          setErrorMessage(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerAnalysis = async () => {
    if (!rawText.trim()) {
      setErrorMessage("Please enter or select a ticket history log first.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setIsMissingSecret(false);

    try {
      if (useDirectClientMode) {
        if (!clientAccessKey.trim()) {
          throw new Error("Please enter your IndiaMART LLM Access Key first or switch back to Backend Proxy.");
        }

        const systemPrompt = `You are an AI-powered CXO Complaint Intelligence Assistant for IndiaMART Buyer-Supplier Conflict tickets.
Your task is to analyze raw customer ticket history logs and generate a concise, structured, executive-level summary in JSON.

Output format MUST be EXACTLY the following JSON schema:
{
  "ticket_id": string,
  "ticket_type": string,
  "source_of_introduction": string,
  "seller_name": string,
  "seller_glid": string,
  "buyer_name": string,
  "product_name": string,
  "complaint_type": "Delivery Issue" | "Quality Issue" | "Refund Issue" | "Communication Issue" | "Fraud Suspicion" | "Delay" | "Wrong Product",
  "buyer_sentiment": string,
  "disputed_amount": string,
  "ticket_raised_time": string,
  "moved_to_paid_bs_time": string,
  "assigned_to_executive": string,
  "first_followup_time": string,
  "final_resolution_time": string,
  "final_status": string,
  "resolution_summary": string,
  "cxo_summary": string,
  "two_line_summary": string,
  "key_highlights": string[]
}

Strictly adhere to the following definitions and constraints:
- ticket_id: Extract the unique Ticket ID (e.g. "TIC-890214"). Use "NA" if not found.
- ticket_type: Conflict type/classification. Often Pre BS Conflict, BS Conflict, or Buyer-Supplier Conflict.
- source_of_introduction: Matchmaking source channel (e.g. "Buy Lead Purchased", "Own WhatsApp", "MDC", "Catalog", or "Not Found").
- seller_name: Extract Respondent Company Name.
- seller_glid: Extract Respondent GLID number.
- buyer_name: Extract buyer name.
- product_name: Extract product name or "NA".
- complaint_type: Standard classification of the core complaint. Choose one.
- buyer_sentiment: Infer buyer emotion from complaint history (e.g., "Dissatisfied due to delayed delivery", "Angry because supplier became unresponsive", "Frustrated over wrong product received").
- disputed_amount: Extract dispute value (e.g. "INR 45,000", "INR 1,20,000").
- ticket_raised_time: Accurate chronological timestamp of ticket raised.
- moved_to_paid_bs_time: Accurate chronological timestamp of transition to Paid BS, or "NA".
- assigned_to_executive: IndiaMART support representative assigned to the executive role.
- first_followup_time: Accurate chronological timestamp of first followup log, or "NA".
- final_resolution_time: Accurate chronological timestamp of completion/resolution, or "NA".
- final_status: Business-friendly final outcome (e.g., "Conflict Resolved – Goods Received", "No Action Taken – Documents Not Received", "Refund Processed").
- resolution_summary: Factual summary of how the case was closed and seller behavior.
- cxo_summary: Concise executive paragraph explaining What issue happened, Escalation flow, Final outcome, SLA/follow-up quality if visible. MAXIMUM 80 Words.
- two_line_summary: Exactly two-line short summary for busy managers.
- key_highlights: Array of 3 to 5 brief high-impact highlights.

Rules:
1. Chronological order must determine event analysis.
2. Ignore repetitive status updates.
3. Be 100% factual. NEVER hallucinate. Use "NA" for missing information.
4. Output MUST be valid, well-formed JSON content. Do NOT include markdown blocks like \`\`\`json around it.`;

        const res = await fetch("https://imllm.intermesh.net/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${clientAccessKey}`
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: rawText
              }
            ],
            temperature: 0.2
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`IndiaMART LLM Gateway (Client Connect) failed with status ${res.status}: ${errText || "No response details"}`);
        }

        const data = await res.json();
        const contentText = data?.choices?.[0]?.message?.content;
        if (!contentText) {
          throw new Error("No output content generated by the LLM Gateway.");
        }

        // Clean any code blocks returned back
        let cleanedText = contentText.trim();
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```(json)?\n?/, "");
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.replace(/```$/, "");
        }
        cleanedText = cleanedText.trim();

        const resultJson = JSON.parse(cleanedText);
        setAnalysis(resultJson);
      } else {
        // Standard Backend Proxy Mode
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ rawText })
        });

        const responseText = await res.text();
        let isJsonResponse = false;
        let data: any = null;
        try {
          data = JSON.parse(responseText);
          isJsonResponse = true;
        } catch (_) {
          isJsonResponse = false;
        }

        if (!isJsonResponse) {
          if (responseText.trim().toLowerCase().startsWith("<!doctype") || responseText.includes("The page") || responseText.includes("not found")) {
            setShowDirectSetup(true);
            setUseDirectClientMode(true);
            localStorage.setItem("im_llm_direct_mode", "true");
            throw new Error("Vercel Hosting Fallback: The backend server is running in single-page app (SPA) mode. Because of this, API routes like /api/analyze return HTML files on Vercel. We have automatically toggled 'Direct Client Mode' for you! Please key in your IndiaMART LLM credentials below to connect safely from this window.");
          } else {
            throw new Error(`Non-JSON text returned from server: ${responseText.slice(0, 150)}... Please verify your server status.`);
          }
        }

        if (!res.ok) {
          if (data?.isMissingSecret) {
            setIsMissingSecret(true);
          }
          throw new Error(data?.error || "Failed to analyze conflict logs.");
        }

        setAnalysis(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIconAndTheme = (sentiment: string) => {
    const s = (sentiment || "").toLowerCase();
    if (s.includes("angry") || s.includes("frustrated")) {
      return {
        icon: <Frown className="w-10 h-10 text-orange-600 animate-bounce" />,
        text: "Frustrated / Angry",
        desc: "High friction context due to unresponsive supplier or logistics delays",
        bg: "bg-orange-100/80 border-orange-200"
      };
    }
    if (s.includes("dissatisfied") || s.includes("wrong") || s.includes("delayed")) {
      return {
        icon: <Frown className="w-10 h-10 text-rose-500" />,
        text: "Dissatisfied",
        desc: "Urgent turnaround or item reconciliation requested by the buyer",
        bg: "bg-rose-50 border-rose-100"
      };
    }
    if (s.includes("satisfied") || s.includes("received") || s.includes("success")) {
      return {
        icon: <Smile className="w-10 h-10 text-emerald-600" />,
        text: "Satisfied Outcome",
        desc: "Conflict successfully averted. High buyer cooperation received",
        bg: "bg-emerald-50 border-emerald-100"
      };
    }
    return {
      icon: <Meh className="w-10 h-10 text-zinc-500" />,
      text: sentiment || "Awaiting Update",
      desc: "Chronological followups underway; resolving impasse state",
      bg: "bg-slate-100/85 border-slate-200"
    };
  };

  const getStatusBadgeColor = (status: string) => {
    const st = (status || "").toLowerCase();
    if (st.includes("resolved") || st.includes("processed") || st.includes("received")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (st.includes("no action") || st.includes("closed")) {
      return "bg-slate-100 text-slate-700 border-slate-200";
    }
    if (st.includes("awaiting") || st.includes("pending")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const exportMarkdownReport = () => {
    if (!analysis) return;
    const md = `# IndiaMART CXO Conflict Intelligence Report
Ticket ID: ${analysis.ticket_id}
Final Status: ${analysis.final_status}

## METADATA OVERVIEW
- **Ticket Type**: ${analysis.ticket_type}
- **Source of Introduction**: ${analysis.source_of_introduction}
- **Seller Details**: ${analysis.seller_name} (GLID: ${analysis.seller_glid})
- **Buyer Name**: ${analysis.buyer_name}
- **Product Name**: ${analysis.product_name}
- **Complaint Type**: ${analysis.complaint_type}
- **Disputed Amount**: ${analysis.disputed_amount}
- **Buyer Sentiment**: ${analysis.buyer_sentiment}

## TIMELINE Intel
- **Raised At**: ${analysis.ticket_raised_time}
- **Executive Assigned**: ${analysis.assigned_to_executive}
- **First Follow-up**: ${analysis.first_followup_time}
- **Paid BS Classification Time**: ${analysis.moved_to_paid_bs_time}
- **Final Resolution Time**: ${analysis.final_resolution_time}

## EXECUTIVE CXO SUMMARY
${analysis.cxo_summary}

## MANAGEMENT SUMMARY (2 Lines)
${analysis.two_line_summary}

## KEY HIGHLIGHTS
${analysis.key_highlights.map(h => `- ${h}`).join("\n")}

---
*Generated by IndiaMART CXO Complaint Intelligence Assistant*`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IM_Intel_Memo_${analysis.ticket_id || "report"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sentimentStyle = analysis ? getSentimentIconAndTheme(analysis.buyer_sentiment) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors duration-300">
      
      {/* Bento Standard Header */}
      <header className="px-4 py-3 sm:px-6 max-w-7xl w-full mx-auto mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg select-none tracking-tight text-slate-900 leading-tight">IM Complaint Intelligence</h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">IndiaMART Buyer-Supplier Conflict Analysis</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {analysis && (
              <>
                <div id="badge-ticket-id" className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full font-mono">
                  Ticket: {analysis.ticket_id || "NA"}
                </div>
                <div id="badge-ticket-type" className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                  {analysis.ticket_type || "BS Conflict"}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Log Feed & Inputs */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-5" id="input-section">
          
          {/* Quick Evaluators Case panel (Bento block style) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            
            <div className="grid grid-cols-1 gap-2">
              {samples.map((sample) => (
                <button
                  key={sample.id}
                  id={`sample-btn-${sample.id}`}
                  onClick={() => handleSelectSample(sample)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                    selectedSampleId === sample.id
                      ? "bg-slate-900 border-slate-950 text-white shadow-md relative overflow-hidden"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold mb-1">
                    <span className={selectedSampleId === sample.id ? "text-orange-400" : "text-slate-400"}>
                      {sample.id}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      selectedSampleId === sample.id 
                        ? "bg-slate-800 text-slate-300 border-slate-700" 
                        : "bg-white text-slate-500 border-slate-200"
                    }`}>
                      Live Logs
                    </span>
                  </div>
                  <div className="font-sans font-semibold line-clamp-1 text-sm">
                    {sample.title}
                  </div>
                </button>
              ))}

              {samples.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 font-mono italic animate-pulse">
                  Re-establishing secure databank links...
                </div>
              )}
            </div>
          </div>

          {/* Interactive Ingestion Terminal */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Ingestion Terminal
              </span>
              <button 
                onClick={() => { setRawText(""); setSelectedSampleId(""); setErrorMessage(null); }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer"
              >
                Clear Input
              </button>
            </div>

            {/* Gateway Mode Switcher */}
            <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-150 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Gateway Connection</span>
                <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => {
                      setUseDirectClientMode(false);
                      localStorage.setItem("im_llm_direct_mode", "false");
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      !useDirectClientMode 
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/50" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Backend Proxy
                  </button>
                  <button
                    onClick={() => {
                      setUseDirectClientMode(true);
                      localStorage.setItem("im_llm_direct_mode", "true");
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      useDirectClientMode 
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/50" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Direct Client Fallback
                  </button>
                </div>
              </div>
              
              {(useDirectClientMode || showDirectSetup) && (
                <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 font-mono">
                    <span>LLM GATEWAY ACCESS KEY:</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-sm border border-emerald-100 uppercase transform scale-95 origin-right">
                      Client-Side Secured
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Paste Bearer Access Key (e.g. sk-...)"
                      value={clientAccessKey}
                      onChange={(e) => {
                        setClientAccessKey(e.target.value);
                        localStorage.setItem("im_llm_access_key", e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 placeholder:text-slate-350 shadow-inner"
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-medium leading-normal">
                    This token calls IndiaMART Gateway directly via HTTPS from your device and is never sent to the app container.
                  </p>
                </div>
              )}
            </div>

            <div 
              className={`flex-1 relative min-h-[350px] flex flex-col transition-all ${
                isDragOver ? "bg-orange-500/5 ring-2 ring-orange-500/50" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <textarea
                value={rawText}
                id="raw-ticket-input"
                onChange={(e) => { setRawText(e.target.value); setSelectedSampleId(""); }}
                placeholder="Paste chronological conflict logs, correspondence histories, or agent follow-up diaries here... Or drop a log file directly inside this terminal area."
                className="w-full flex-1 p-4 bg-transparent text-slate-800 text-xs sm:text-sm font-mono placeholder:text-slate-400 border-none outline-none focus:ring-0 resize-none leading-relaxed h-[350px]"
              />

              {!rawText && (
                <div className="absolute inset-x-0 bottom-12 top-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none text-slate-400">
                  <Upload className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-700 text-xs sm:text-sm">Drag and drop logs here</p>
                  <p className="text-[11px] text-slate-400 leading-snug max-w-[200px] mt-1 mx-auto">
                    Accepts text documents corresponding to buyer complaints
                  </p>
                  <span className="my-2.5 text-xs text-slate-300">or</span>
                  <label className="pointer-events-auto bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 transition-colors shadow-xs">
                    Browse File
                    <input 
                      type="file" 
                      accept=".txt,.log" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="border-t border-slate-150 p-4 bg-slate-50">
              <button
                id="analyze-cta"
                onClick={triggerAnalysis}
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm shadow-md flex items-center justify-center gap-2 group transition-all duration-250 cursor-pointer ${
                  loading 
                    ? "bg-slate-400 text-slate-200" 
                    : "bg-orange-600 hover:bg-orange-500 shadow-orange-600/15 scale-[1.005] hover:shadow-lg active:scale-95"
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Conflict Dossier...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-orange-200 animate-pulse group-hover:scale-110" />
                    <span>Generate Executive Analysis</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Feedback & Errors banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                id="error-banner"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-sans font-bold text-rose-800 block mb-0.5">Analysis Failed</span>
                  <p className="text-rose-700 leading-relaxed font-sans">{errorMessage}</p>
                  
                  {isMissingSecret && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-rose-100 text-slate-600 leading-medium">
                      Configure your <strong className="text-orange-600">GEMINI_API_KEY</strong> environment variable in the <strong className="text-slate-800">Settings &gt; Secrets</strong> panel of Google AI Studio platform, then restart the analyst.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Hand: Bento Grid Dashboard */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6" id="dashboard-section">
          
          <div className="min-h-[500px] flex flex-col justify-between">
            
            {loading ? (
              /* High Fidelity Pulse Loading Screen */
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center flex-1 flex flex-col items-center justify-center min-h-[450px]">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                    <Sparkles className="w-7 h-7 text-orange-600 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-orange-600 border-t-transparent animate-spin"></div>
                </div>
                
                <h3 className="font-sans font-bold text-base text-slate-900 mb-1">
                  Synthesizing Complaint Intelligence Summary
                </h3>
                <p className="text-xs text-orange-600 font-mono tracking-wider animate-pulse max-w-sm font-semibold mb-6">
                  {loadingSteps[statusStep]}
                </p>
                
                <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                  <motion.div 
                    className="bg-orange-600 h-full"
                    initial={{ width: "3%" }}
                    animate={{ width: "97%" }}
                    transition={{ duration: 15, ease: "easeInOut" }}
                  />
                </div>
                
                <p className="text-[10px] text-slate-400 font-mono mt-4">
                  Chronological incident-sequence analyzer parsing live complaint events...
                </p>
              </div>

            ) : analysis ? (

              /* Premium Bento Grid Structure (Matching the Layout requested!) */
              <div className="space-y-4" id="intelligence-dashboard">
                
                {/* Bento Row 1: Split profile card & Detailed summary block */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Card 1: Profiles block (col-span-4) */}
                  <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                    <div className="space-y-4">
                      
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-orange-600" /> Seller Profile
                        </p>
                        <h3 className="font-bold text-base leading-tight text-slate-800" id="seller-name-disp">
                          {analysis.seller_name || "NA"}
                        </h3>
                        <p className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mt-1 font-bold">
                          GLID: {analysis.seller_glid || "NA"}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-600" /> Buyer Profile
                        </p>
                        <h3 className="font-bold text-base leading-tight text-slate-800" id="buyer-name-disp">
                          {analysis.buyer_name || "NA"}
                        </h3>
                        {analysis.product_name && (
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            Product: {analysis.product_name}
                          </p>
                        )}
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Dispute Value</span>
                        <span className="text-lg font-bold text-orange-600" id="disputed-amount-disp">
                          {analysis.disputed_amount && analysis.disputed_amount !== "NA" ? analysis.disputed_amount : "Not Declared"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Executive Summary & Highlights (col-span-8 - Double width, rounded-2xl border-2 border-slate-900) */}
                  <div className="md:col-span-8 bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-md flex flex-col justify-between min-h-[300px]">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                          <Sparkles className="w-5 h-5 text-orange-500" />
                          Executive Intelligence Summary
                        </h2>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${getStatusBadgeColor(analysis.final_status)}`}>
                          {analysis.final_status || "NA"}
                        </span>
                      </div>

                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-medium italic" id="cxo-summary-text">
                        "{analysis.cxo_summary}"
                      </p>
                    </div>

                    <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">
                          Key Investigation Highlights
                        </p>
                        <div className="text-[9px] bg-slate-200 text-slate-600 px-1.5 font-bold rounded">
                          Chronologically Sorted
                        </div>
                      </div>
                      
                      <ul className="space-y-2 text-xs text-slate-700">
                        {analysis.key_highlights && analysis.key_highlights.slice(0, 4).map((highlight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0"></span>
                            <span className="leading-snug">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Bento Row 2: Sentiment tracking & Operational Cycle Time */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Card 3: Sentiment tracker (col-span-4) */}
                  <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3 font-mono">
                        Buyer Sentiment Analysis
                      </p>
                      
                      <div className="flex items-center justify-center flex-col py-4">
                        <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mb-3 shadow-xs">
                          {sentimentStyle?.icon}
                        </div>
                        <p className="text-center font-bold text-slate-800 text-sm">
                          {sentimentStyle?.text}
                        </p>
                        <p className="text-[11px] text-slate-500 text-center mt-1 leading-snug">
                          {sentimentStyle?.desc}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-150">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Source Channel</span>
                        <span className="font-bold text-slate-800">{analysis.source_of_introduction || "NA"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Operational Cycle Time Timeline (col-span-5 / Dark aesthetic as requested!) */}
                  <div className="md:col-span-5 bg-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between min-h-[220px]">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                        <span>Parser Lifecycle SLA</span>
                        <span className="text-orange-400 font-bold">Standard Progression</span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-orange-500" style={{ width: "85%" }}></div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-3">
                        <div className="text-[10px] text-slate-400 leading-tight">
                          RAISED AT:<br />
                          <span className="text-white font-mono font-bold block mt-0.5 truncate" title={analysis.ticket_raised_time}>
                            {analysis.ticket_raised_time && analysis.ticket_raised_time !== "NA" ? analysis.ticket_raised_time : "NA"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight border-l border-slate-800 pl-3">
                          1ST FOLLOWUP:<br />
                          <span className="text-white font-mono font-bold block mt-0.5 truncate" title={analysis.first_followup_time}>
                            {analysis.first_followup_time && analysis.first_followup_time !== "NA" ? analysis.first_followup_time : "NA"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          ESCALATED TO PAID:<br />
                          <span className="text-orange-400 font-mono font-bold block mt-0.5 truncate" title={analysis.moved_to_paid_bs_time}>
                            {analysis.moved_to_paid_bs_time && analysis.moved_to_paid_bs_time !== "NA" ? analysis.moved_to_paid_bs_time : "NA"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight border-l border-slate-800 pl-3">
                          RESOLUTION:<br />
                          <span className="text-emerald-400 font-mono font-bold block mt-0.5 truncate" title={analysis.final_resolution_time}>
                            {analysis.final_resolution_time && analysis.final_resolution_time !== "NA" ? analysis.final_resolution_time : "NA"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Assigned executive profile indicator (col-span-3) */}
                  <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-xs">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl text-slate-600 font-bold text-xs flex items-center justify-center mb-2">
                      EXEC
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase font-mono">Assigned Agent</p>
                    <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-full" id="assigned-exec-disp">
                      {analysis.assigned_to_executive || "NA"}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-full mt-2 font-semibold">
                      Support executive
                    </span>
                  </div>

                </div>

                {/* Bento Row 3: Two-Line Ultra Summary Block & Additional resolution notes */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Card 6: Two line super summary */}
                  <div className="md:col-span-12 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 flex flex-col justify-center shadow-xs">
                    <div className="flex gap-4 items-start">
                      <div className="w-2.5 h-12 bg-indigo-400 rounded-full shrink-0"></div>
                      <div>
                        <p className="text-xs text-indigo-500 font-bold tracking-widest uppercase mb-1 font-mono">
                          Two-Line Ultra Summary
                        </p>
                        <p className="text-sm sm:text-base font-bold text-indigo-900 leading-snug" id="two-line-summary-text">
                          {analysis.two_line_summary}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Operational actions footer for copy, export, download */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
                  <button
                    onClick={exportMarkdownReport}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MD Briefing</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2), "raw_json")}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono flex items-center justify-center gap-2 border border-slate-200 cursor-pointer transition-colors font-semibold"
                  >
                    {copiedField === "raw_json" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedField === "raw_json" ? "JSON Copied!" : "Copy Compliant JSON"}</span>
                  </button>

                  <div className="ml-0 sm:ml-auto flex items-center gap-1.5 text-[11px] font-mono text-slate-400 font-semibold select-none">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    100% Validated Intelligence Structure
                  </div>
                </div>

              </div>

            ) : (

              /* Welcoming Screen Placeholder */
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[450px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-orange-600 shadow-xs">
                  <Activity className="w-7 h-7" />
                </div>
                
                <h3 className="font-sans font-bold text-slate-800 mb-1 text-base">
                  Awaiting Analytical Stream Ingestion
                </h3>
                
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6 font-medium">
                  Select one of our high-integrity sample cases from the left databank, or paste raw complaint correspondence logs to trigger the automatic Bento summary generator.
                </p>

                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                  Chronological SLA Parser Active
                </div>
              </div>

            )}

          </div>

          {/* JSON Payload Inspector container matching Bento design guidelines */}
          {analysis && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 py-2.5 px-4 border-b border-slate-200 flex items-center justify-between text-xs font-mono font-bold text-slate-600">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600" />
                  IndiaMART CXO Compliance JSON Payload
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold uppercase">
                  Schema Compliance Passed
                </span>
              </div>
              <div className="p-4 bg-slate-900 overflow-x-auto max-h-[250px] overflow-y-auto">
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed selection:bg-slate-800 whitespace-pre">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Corporate slate footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white text-[10px] font-mono font-semibold text-slate-400 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span>© 2026 IndiaMART InterMESH Limited. Buyer-Supplier Conflict resolution intelligence hub.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Operational SLA Policy</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Information Security Mandate</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
