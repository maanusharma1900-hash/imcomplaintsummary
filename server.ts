import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "15mb" }));

// Sample Tickets data for quick evaluation in presentation UI
const SAMPLE_TICKETS = [
  {
    id: "TIC-890214",
    title: "Unresponsive Supplier on LED Lights Order",
    rawText: `
[2026-05-10 10:00:00 BST]
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
Final Status: Conflict Resolved - Refund Processed
    `
  },
  {
    id: "TIC-449102",
    title: "Wrong Product Delivered - High-Density Foam Blocks",
    rawText: `
[2026-05-12 09:00:00 BST]
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
Final Outcome: Conflict Resolved - Correct Goods Received
    `
  },
  {
    id: "TIC-660193",
    title: "Missing Documents - Industrial Steel Flanges",
    rawText: `
[2026-05-14 11:15:00 BST]
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
Status: No Action Taken – Documents Not Received
    `
  }
];

// POST /api/analyze
app.post("/api/analyze", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return res.status(400).json({ error: "rawText parameter is required." });
    }

    // Check if key exists. Let's fail gracefully as per Guidelines
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add it to your secrets.",
        isMissingSecret: true
      });
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

    // Fetch from IndiaMART private LLM Gateway
    const response = await fetch("https://imllm.intermesh.net/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM Gateway responded with error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const outputText = data?.choices?.[0]?.message?.content;
    if (!outputText) {
      throw new Error("No output generated from IndiaMART LLM Gateway.");
    }

    // Strip markdown code fences if returned by the gateway
    let cleanedText = outputText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(json)?\n?/, "");
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.replace(/```$/, "");
    }
    cleanedText = cleanedText.trim();

    const resultJson = JSON.parse(cleanedText);
    return res.json(resultJson);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: error?.message || "Internal Server Error analyzing ticket logs with LLM Gateway",
      details: error.stack
    });
  }
});

// GET /api/samples
app.get("/api/samples", (req, res) => {
  res.json(SAMPLE_TICKETS);
});

// Serve static React application
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IndiaMART Conflict Intel server running on port ${PORT}`);
  });
}

startServer();
