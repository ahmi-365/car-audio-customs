import { existsSync } from "fs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const BRAND_NAME = "HR Car Audio & Tints";
const BRAND_LOGO_CID = "hrcaraudio-brand-logo";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, "../../");
const BRAND_LOGO_PATH = path.join(BACKEND_ROOT, "assets/hr-logo.png");

let transporter = null;

function getBrandLogoAttachment() {
  if (!existsSync(BRAND_LOGO_PATH)) return null;
  return {
    filename: "hr-logo.png",
    path: BRAND_LOGO_PATH,
    cid: BRAND_LOGO_CID,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `£${amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTransporter() {
  if (transporter) return transporter;

  const auth = process.env.SMTP_USER
    ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
    : undefined;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth,
  });

  return transporter;
}

function buildTemplate({ title, greeting, intro, sections = [], highlights = [], cta, outro, preheader, footer }) {
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting || "Hello,");
  const safeIntro = escapeHtml(intro || "");

  const sectionRows = sections
    .filter((s) => s && s.label && s.value !== undefined && s.value !== null && String(s.value).trim() !== "")
    .map(
      (s) =>
        `<tr><td style="padding:12px 0;color:#6b7280;font-size:14px;vertical-align:top;border-bottom:1px solid #f3f4f6;">${escapeHtml(s.label)}</td><td style="padding:12px 0;color:#111827;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #f3f4f6;">${escapeHtml(s.value)}</td></tr>`
    )
    .join("");

  const highlightsHtml = highlights
    .filter(Boolean)
    .map((item) => `<li style="margin:0 0 10px 0;font-size:14px;color:#374151;">${escapeHtml(item)}</li>`)
    .join("");

  const ctaHtml = cta?.url && cta?.label
    ? `<div style="text-align:center;margin:30px 0;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.02em;text-transform:uppercase;box-shadow:0 4px 6px rgba(220, 38, 38, 0.2);">${escapeHtml(cta.label)}</a></div>`
    : "";

  const safeOutro = escapeHtml(outro || "");
  const safeFooter = footer || `© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br>Professional Installation & Customization`;
  const hasBrandLogo = existsSync(BRAND_LOGO_PATH);

  const html = `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || safeTitle)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:40px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#ffffff;padding:30px 24px;text-align:center;border-bottom:1px solid #e5e7eb;">
                ${hasBrandLogo
      ? `<img src="cid:${BRAND_LOGO_CID}" alt="${BRAND_NAME}" style="display:block;margin:0 auto;max-height:70px;width:auto;" />`
      : `<div style="color:#111827;font-size:24px;font-weight:800;letter-spacing:-0.5px;">${BRAND_NAME}</div>`}
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px;">
                <h1 style="margin:0 0 20px 0;font-size:28px;line-height:1.2;color:#111827;font-weight:800;">${safeTitle}</h1>
                <p style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#111827;">${safeGreeting}</p>
                ${safeIntro ? `<p style="margin:0 0 32px 0;font-size:16px;line-height:1.6;color:#4b5563;">${safeIntro}</p>` : ""}
                ${sectionRows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 32px 0;border-top:2px solid #111827;">${sectionRows}</table>` : ""}
                ${highlightsHtml ? `<ul style="margin:0 0 32px 20px;padding:0;color:#374151;font-size:16px;line-height:1.6;">${highlightsHtml}</ul>` : ""}
                ${ctaHtml}
                ${safeOutro ? `<p style="margin:32px 0 0 0;font-size:15px;line-height:1.6;color:#6b7280;text-align:center;font-style:italic;">${safeOutro}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:32px;background:#111827;color:#9ca3af;font-size:13px;line-height:1.6;text-align:center;border-top:1px solid #1f2937;">
                ${safeFooter}<br>
                <div style="margin-top:16px;color:#6b7280;">info@hrcaraudio.co.uk • +44 7865 543241</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textRows = sections
    .filter((s) => s && s.label && s.value !== undefined && s.value !== null && String(s.value).trim() !== "")
    .map((s) => `- ${s.label}: ${s.value}`)
    .join("\n");

  const textHighlights = highlights.filter(Boolean).map((item) => `- ${item}`).join("\n");

  const text = [
    title,
    "",
    greeting || "Hello,",
    intro || "",
    textRows,
    textHighlights,
    cta?.url ? `${cta.label}: ${cta.url}` : "",
    outro || "",
    "",
    footer || `You are receiving this email from ${BRAND_NAME}.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

async function buildByType(type, data = {}) {
  if (type === "invoice_notification") {
    return {
      subject: `Invoice ${data.invoiceNumber || ""} – ${BRAND_NAME}`,
      ...buildTemplate({
        preheader: `Invoice ${data.invoiceNumber || ""} from ${BRAND_NAME}`,
        title: "New Invoice",
        greeting: `Hello ${data.clientName || "there"},`,
        intro: data.message || "Your invoice for professional installation and customization services has been generated. Please find the details below and a full itemized PDF attached.",
        sections: [
          { label: "Invoice Number", value: data.invoiceNumber || "-" },
          { label: "Date", value: formatDate(data.date) },
          { label: "Total Amount", value: formatCurrency(data.total) },
          { label: "Deposit Paid", value: formatCurrency(data.depositPaid) },
          { label: "Balance Due", value: formatCurrency(data.balanceDue) },
        ],
        cta: undefined,
        outro: "Thank you for choosing HR Car Audio & Tints! We appreciate your business.",
      }),
    };
  }

  // Support for other types if needed (copied from user request and adapted)
  if (type === "installation_confirmation") {
    return {
      subject: "Installation booking received",
      ...buildTemplate({
        preheader: "Your installation request has been received",
        title: "Booking Received",
        greeting: `Hi ${data.fullName || "there"},`,
        intro: "Thanks for booking with us. We have received your installation request and our team will be in touch shortly.",
        sections: [
          { label: "Service", value: data.serviceType || "Car audio installation" },
          { label: "Preferred Date", value: formatDate(data.preferredDate) },
          { label: "Vehicle", value: [data.vehicleMake, data.vehicleModel, data.vehicleYear].filter(Boolean).join(" ") || "-" },
        ],
        outro: "We usually confirm slots within one business day.",
      }),
    };
  }

  return {
    subject: `${BRAND_NAME} Notification`,
    ...buildTemplate({
      title: data.title || "Update",
      greeting: `Hi ${data.name || "there"},`,
      intro: data.message || "You have a new update from HR Car Audio & Tints.",
    }),
  };
}

export async function sendTemplatedEmail({ type, to, data = {}, attachments = [] }) {
  if (!to) return { success: false, reason: "Missing recipient" };

  const content = await buildByType(type, data);
  const brandLogoAttachment = getBrandLogoAttachment();

  try {
    const senderEmail = process.env.SMTP_FROM || "info@hrcaraudio.co.uk";
    const fromHeader = process.env.SMTP_FROM_NAME 
      ? `"${process.env.SMTP_FROM_NAME}" <${senderEmail}>`
      : `"${BRAND_NAME}" <${senderEmail}>`;

    const allAttachments = [];
    if (brandLogoAttachment) allAttachments.push(brandLogoAttachment);
    if (attachments && Array.isArray(attachments)) {
      allAttachments.push(...attachments);
    }

    const transport = getTransporter();
    const info = await transport.sendMail({
      from: fromHeader,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[email] Failed to send ${type}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}
