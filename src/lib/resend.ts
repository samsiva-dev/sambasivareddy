import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Per-purpose "from" addresses — all must be verified in Resend.
// Falls back to onboarding@resend.dev for testing before domain verification.
const domain = process.env.RESEND_DOMAIN || "sambasivareddy.in";
const fallback = "onboarding@resend.dev";

/** hello@ — welcome & farewell emails */
export const emailFromHello =
  process.env.RESEND_FROM_EMAIL || `Samba Siva Reddy <hello@${domain}>`;

/** blog@ — new-post notifications */
export const emailFromBlog =
  process.env.RESEND_FROM_BLOG || `Samba's Blog <blog@${domain}>`;

/** digest@ — monthly digest emails */
export const emailFromDigest =
  process.env.RESEND_FROM_DIGEST || `Monthly Digest <digest@${domain}>`;

/** @deprecated — use the specific variants above */
export const emailFrom = emailFromHello;
