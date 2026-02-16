/**
 * Send transactional email via Resend (https://resend.com).
 * If RESEND_API_KEY is not set, no email is sent and the function resolves without error.
 */

const RESEND_API = "https://api.resend.com/emails";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from = options.from || process.env.EMAIL_FROM || "Factory Truth <onboarding@resend.dev>";
  const to = options.to.trim().toLowerCase();
  if (!to) return false;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: options.subject,
        html: options.html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend email error", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendEmail error", e);
    return false;
  }
}
