import type { QuoteDetails } from "./types";
export type Enquiry = {
  id: string; ref: string; lang: "en" | "ar"; design_id: string | null; design_name: string | null;
  customer_name: string; phone: string; email: string | null;
  karat: string | null; color: string | null; size: string | null; weight_est: number | null; stone: string | null;
  engraving_text: string | null; engraving_font: string | null; notes: string | null; reference_images: string[];
  estimate_lo: number | null; estimate_hi: number | null; rate_at_request: number | null;
  status: string; quote: QuoteDetails | null; quoted_at: string | null; approval_images: string[]; approved_at: string | null;
  admin_notes: string | null; created_at: string; updated_at: string;
};
