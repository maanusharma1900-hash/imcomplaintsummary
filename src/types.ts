export interface ConflictTicketAnalysis {
  ticket_id: string;
  ticket_type: string;
  source_of_introduction: string;
  seller_name: string;
  seller_glid: string;
  buyer_name: string;
  product_name: string;
  complaint_type: string;
  buyer_sentiment: string;
  disputed_amount: string;
  ticket_raised_time: string;
  moved_to_paid_bs_time: string;
  assigned_to_executive: string;
  first_followup_time: string;
  final_resolution_time: string;
  final_status: string;
  resolution_summary: string;
  cxo_summary: string;
  two_line_summary: string;
  key_highlights: string[];
}

export interface SampleTicket {
  id: string;
  title: string;
  rawText: string;
}
