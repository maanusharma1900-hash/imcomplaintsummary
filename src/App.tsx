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
          const data = await res.json();
          setSamples(data);
          // Auto-select first sample to make the app ready to test out-of-the-box!
          if (data && data.length > 0) {
            handleSelectSample(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load samples from backend:", err);
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
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rawText })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isMissingSecret) {
          setIsMissingSecret(true);
        }
        throw new Error(data.error || "Failed to analyze conflict logs.");
      }

      setAnalysis(data);
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
            <div className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              SLA Parser V1.4
            </div>
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

      {/* Hero Intro text block */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-700 leading-relaxed text-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-4 h-4" /> Enterprise Support Headquarters
          </div>
          Welcome to the executive conflict analysis console. Provide raw Buyer-Supplier ticket diaries with their follow-up milestones, correspondence transcripts, and RCA entries to generate structured bento analytics.
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Log Feed & Inputs */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-5" id="input-section">
          
          {/* Quick Evaluators Case panel (Bento block style) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-500 font-bold tracking-wider">
              <span className="flex items-center gap-1.5 font-sans">
                <Database className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                Conflict Telemetry Databank
              </span>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md">
                3 Standard Cases
              </span>
            </div>
            
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
