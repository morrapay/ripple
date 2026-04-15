"use client";

import { useState } from "react";
import type { SuggestedContent } from "@/lib/ai/content-suggester";
import type { CommType } from "@/lib/communication-constants";

interface CommunicationPreviewProps {
  channel: string;
  content: SuggestedContent | null;
  commName: string;
  communicationType?: CommType | null;
}

/* ───── Shared components ───── */

function PayoneerLogo() {
  return (
    <svg width="124" height="24" viewBox="0 0 124 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Payoneer">
      <defs>
        <linearGradient id="pnr-halo" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF4800" />
          <stop offset="25%" stopColor="#DA54D8" />
          <stop offset="50%" stopColor="#0092F4" />
          <stop offset="75%" stopColor="#20DC86" />
          <stop offset="100%" stopColor="#DFD902" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11.5" stroke="url(#pnr-halo)" strokeWidth="1" fill="none" />
      <circle cx="12" cy="12" r="8" fill="#252526" />
      <circle cx="12" cy="12" r="5.5" fill="white" />
      <text x="30" y="17" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="16" fill="#252526">Payoneer</text>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      <rect x="7.5" y="1.67" width="85" height="96.66" rx="6" fill="#EFEFEF" />
      <rect x="14.17" y="8.33" width="71.66" height="83.34" rx="4" fill="#252526" />
      <rect x="22.5" y="17.5" width="55" height="65" rx="3" fill="url(#shield-grad)" />
      <defs>
        <linearGradient id="shield-grad" x1="22.5" y1="17.5" x2="77.5" y2="82.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF4800" />
          <stop offset="50%" stopColor="#DA54D8" />
          <stop offset="100%" stopColor="#0092F4" />
        </linearGradient>
      </defs>
      <path d="M50 35 L50 55 M50 62 L50 63" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <div style={{ width: 80, height: 80, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" fill="#EFEFEF" />
        <circle cx="40" cy="40" r="28" fill="#252526" />
        <defs>
          <linearGradient id="pay-icon-grad" x1="28" y1="28" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF4800" />
            <stop offset="50%" stopColor="#DA54D8" />
            <stop offset="100%" stopColor="#0092F4" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="18" fill="url(#pay-icon-grad)" />
        <path d="M40 30v20M34 36l6-6 6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SocialIcon({ letter }: { letter: string }) {
  return (
    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#878787", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "Arial, sans-serif" }}>{letter}</span>
    </div>
  );
}

function CtaButton({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ width: 250, height: 48, background: "linear-gradient(95.74deg, #D85AD6 -53.26%, #0075E1 118.75%)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 18, lineHeight: "24px" }}>{text}</span>
      </div>
    </div>
  );
}

function EmailFooter() {
  return (
    <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ width: "100%", height: 1, background: "#DCDCDC" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, textAlign: "center", lineHeight: "130%" }}>
            Payoneer in your pocket<br />
            <span style={{ fontWeight: 400 }}>Our mobile app gives you the power of Payoneer when on the go</span>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 125, height: 36, borderRadius: 6, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 500, fontFamily: "Arial, sans-serif" }}>App Store</span>
            </div>
            <div style={{ width: 125, height: 36, borderRadius: 6, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 500, fontFamily: "Arial, sans-serif" }}>Google Play</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height: 1, background: "#DCDCDC" }} />

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
          <SocialIcon letter="f" />
          <SocialIcon letter="X" />
          <SocialIcon letter="in" />
          <SocialIcon letter="▶" />
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "240%", textAlign: "center", color: "#0075E1", textDecoration: "underline" }}>
          Unsubscribe | Support center | Privacy policy | Terms and conditions
        </p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "150%", textAlign: "center", color: "#666666" }}>
          For more information visit us at www.payoneer.com
        </p>
        <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "150%", color: "#666666" }}>
            © 2005-2026 Payoneer. All Rights Reserved
          </p>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "150%", color: "#666666" }}>
            Payoneer payment services are provided in partnership with various financial institutions. Please see your account/card terms and conditions for further details.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───── Operational Email ───── */

function OperationalEmailPreview({
  content, commName, viewport,
}: {
  content: SuggestedContent | null;
  commName: string;
  viewport: "web" | "mobile";
}) {
  const hasContent = content && (content.headline || content.body);
  const c = content ?? {
    subject: "Subject line...",
    headline: commName || "Headline goes here",
    body: "Your email body content will appear here once you generate or write it.",
    ctaText: "Call to Action",
    ctaLink: "#",
    footer: "",
  };

  const containerWidth = viewport === "web" ? 520 : 393;
  const bodyWidth = containerWidth - 48;
  const paragraphs = c.body.split("\n").filter(Boolean);

  return (
    <div style={{ width: containerWidth, fontFamily: "Arial, sans-serif", background: "#FFFFFF", color: "#252526", margin: "0 auto", borderRadius: 8, overflow: "hidden", border: "1px solid #DCDCDC" }}>
      {/* Subject line indicator */}
      {c.subject && (
        <div style={{ background: "#F5F5F5", padding: "10px 24px", borderBottom: "1px solid #DCDCDC", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Subject</span>
          <span style={{ fontSize: 14, color: "#252526" }}>{c.subject}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ padding: "24px 24px 0" }}><PayoneerLogo /></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px", gap: 16 }}>
          <ShieldIcon />
          <h2 style={{ width: bodyWidth, fontWeight: 700, fontSize: 24, lineHeight: "150%", textAlign: "center", margin: 0 }}>{c.headline}</h2>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "40px 24px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>Hi &#123;&#123;first_name&#125;&#125;,</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>{p}</p>
            ))}
          </div>
        </div>

        {c.ctaText && <CtaButton text={c.ctaText} />}

        {c.footer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {c.footer.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} style={{ margin: 0, fontSize: 14, lineHeight: "150%", color: "#666" }}>{line}</p>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>Thank you,</p>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>The Payoneer Team</p>
        </div>

        {!hasContent && (
          <div style={{ padding: "16px", background: "#FFF7ED", border: "1px dashed #F59E0B", borderRadius: 8, textAlign: "center" as const }}>
            <p style={{ margin: 0, fontSize: 13, color: "#92400E" }}>Generate or write content in the Content tab to see it rendered here</p>
          </div>
        )}
      </div>

      <EmailFooter />
    </div>
  );
}

/* ───── Transactional Email ───── */

function TransactionalEmailPreview({
  content, commName, viewport,
}: {
  content: SuggestedContent | null;
  commName: string;
  viewport: "web" | "mobile";
}) {
  const hasContent = content && (content.headline || content.body);
  const c = content ?? {
    subject: "Subject line...",
    headline: commName || "Headline goes here",
    body: "Your email body content will appear here once you generate or write it.",
    ctaText: "Call to Action",
    ctaLink: "#",
    footer: "",
  };

  const containerWidth = viewport === "web" ? 520 : 393;
  const bodyWidth = containerWidth - 48;
  const paragraphs = c.body.split("\n").filter(Boolean);

  return (
    <div style={{ width: containerWidth, fontFamily: "Arial, sans-serif", background: "#FFFFFF", color: "#252526", margin: "0 auto", borderRadius: 8, overflow: "hidden", border: "1px solid #DCDCDC" }}>
      {/* Subject line indicator */}
      {c.subject && (
        <div style={{ background: "#F5F5F5", padding: "10px 24px", borderBottom: "1px solid #DCDCDC", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Subject</span>
          <span style={{ fontSize: 14, color: "#252526" }}>{c.subject}</span>
        </div>
      )}

      {/* Header with hero */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ padding: "24px 24px 0" }}><PayoneerLogo /></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px", gap: 16 }}>
          <PaymentIcon />
          <div style={{ width: bodyWidth, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24, lineHeight: "150%", textAlign: "center" }}>
              {c.headline}
            </h2>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "32px 24px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>Hi &#123;&#123;first_name&#125;&#125;,</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>{p}</p>
            ))}
          </div>
        </div>

        {c.ctaText && <CtaButton text={c.ctaText} />}

        {c.footer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {c.footer.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} style={{ margin: 0, fontSize: 14, lineHeight: "150%", color: "#666" }}>{line}</p>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 8 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>Thank you,</p>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "150%" }}>The Payoneer Team</p>
        </div>

        {!hasContent && (
          <div style={{ padding: "16px", background: "#FFF7ED", border: "1px dashed #F59E0B", borderRadius: 8, textAlign: "center" as const }}>
            <p style={{ margin: 0, fontSize: 13, color: "#92400E" }}>Generate or write content in the Content tab to see it rendered here</p>
          </div>
        )}
      </div>

      <EmailFooter />
    </div>
  );
}

/* ───── Other channel previews ───── */

function SmsPreview({ content, commName }: { content: SuggestedContent | null; commName: string }) {
  const hasContent = content && (content.body || content.headline);
  const c = content ?? { subject: "", headline: commName, body: "", ctaText: "", ctaLink: "", footer: "" };
  const parts = [c.headline, c.body.split("\n")[0], c.ctaLink].filter(Boolean);
  const smsText = hasContent ? parts.join(" — ") : "Your SMS content will appear here once you generate or write it.";
  return (
    <div className="max-w-[300px] mx-auto">
      <div className="rounded-2xl bg-zinc-800 p-4 border border-zinc-700">
        <div className="text-center mb-3">
          <p className="text-[10px] text-zinc-500">SMS Preview</p>
          <p className="text-xs text-zinc-400">Payoneer</p>
        </div>
        <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-4 py-3 max-w-[85%]">
          <p className="text-sm text-zinc-200 leading-relaxed">{smsText.slice(0, 160)}</p>
        </div>
        <p className={`text-[10px] mt-2 ml-1 ${smsText.length > 160 ? "text-red-400" : "text-zinc-600"}`}>{smsText.length}/160 characters</p>
      </div>
    </div>
  );
}

function PushPreview({ content, commName }: { content: SuggestedContent | null; commName: string }) {
  const hasContent = content && (content.headline || content.body);
  const c = content ?? { subject: "", headline: commName, body: "", ctaText: "", ctaLink: "" };
  return (
    <div className="max-w-[340px] mx-auto">
      <div className="rounded-2xl bg-zinc-800/80 backdrop-blur border border-zinc-700 px-4 py-3 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">P</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[11px] font-medium text-zinc-300">Payoneer</p>
              <p className="text-[10px] text-zinc-600">now</p>
            </div>
            <p className="text-sm font-medium text-zinc-200 truncate">{c.headline || (hasContent ? "" : "Push headline appears here")}</p>
            <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{c.body.split("\n")[0] || (hasContent ? "" : "Push body content appears here")}</p>
          </div>
        </div>
      </div>
      {hasContent && c.headline && (
        <p className={`text-[10px] text-center mt-2 ${(c.headline?.length ?? 0) > 50 ? "text-amber-400" : "text-zinc-600"}`}>
          Headline: {c.headline.length}/50 chars {c.headline.length > 50 && "(exceeds limit)"}
        </p>
      )}
    </div>
  );
}

function BannerPreview({ content, commName }: { content: SuggestedContent | null; commName: string }) {
  const hasContent = content && (content.headline || content.body);
  const c = content ?? { subject: "", headline: commName, body: "", ctaText: "Learn More", ctaLink: "#" };
  return (
    <div className="max-w-[500px] mx-auto">
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-6 py-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-100 mb-0.5">{c.headline || (hasContent ? "" : "Banner headline")}</p>
          <p className="text-sm text-zinc-400 line-clamp-2">{c.body.split("\n")[0] || (hasContent ? "" : "Banner body content appears here")}</p>
        </div>
        {c.ctaText && (
          <span className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">
            {c.ctaText}
          </span>
        )}
      </div>
    </div>
  );
}

function AlertPreview({ content, commName }: { content: SuggestedContent | null; commName: string }) {
  const hasContent = content && (content.headline || content.body);
  const c = content ?? { subject: "", headline: commName, body: "", ctaText: "Take Action", ctaLink: "#" };
  return (
    <div className="max-w-[400px] mx-auto">
      <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3">
        <div className="flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0 mt-0.5">
            <path d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 0 0 2.54 20h18.92a1 1 0 0 0 .85-1.28l-8.6-14.86a1 1 0 0 0-1.42 0z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-200 mb-1">{c.headline || (hasContent ? "" : "Alert headline")}</p>
            <p className="text-xs text-zinc-400 mb-2">{c.body.split("\n")[0] || (hasContent ? "" : "Alert body content appears here")}</p>
            {c.ctaText && <button className="text-xs text-amber-400 hover:text-amber-300 font-medium">{c.ctaText} →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Main Export ───── */

export function CommunicationPreview({ channel, content, commName, communicationType }: CommunicationPreviewProps) {
  const [viewport, setViewport] = useState<"web" | "mobile">("web");

  if (!channel) {
    return (
      <div className="text-center py-12 text-zinc-500 text-sm">
        Select a channel to see the preview
      </div>
    );
  }

  const isEmail = channel === "email";
  const isTransactional = communicationType === "TRANSACTIONAL";

  const emailPreview = isTransactional
    ? <TransactionalEmailPreview content={content} commName={commName} viewport={viewport} />
    : <OperationalEmailPreview content={content} commName={commName} viewport={viewport} />;

  const previews: Record<string, () => React.ReactNode> = {
    email: () => emailPreview,
    sms: () => <SmsPreview content={content} commName={commName} />,
    push: () => <PushPreview content={content} commName={commName} />,
    whatsapp: () => <SmsPreview content={content} commName={commName} />,
    jumbotron: () => <BannerPreview content={content} commName={commName} />,
    banner: () => <BannerPreview content={content} commName={commName} />,
    in_product_alert: () => <AlertPreview content={content} commName={commName} />,
    notification_center: () => <AlertPreview content={content} commName={commName} />,
  };

  const render = previews[channel];
  return (
    <div className="py-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {channel.replace(/_/g, " ")} Preview
          {isEmail && communicationType && (
            <span className="ml-1.5 normal-case">
              ({isTransactional ? "Transactional" : communicationType === "PROMOTIONAL" ? "Promotional" : "Operational"})
            </span>
          )}
        </p>
        {isEmail && (
          <div className="flex rounded-md border border-zinc-700 overflow-hidden ml-2">
            <button
              onClick={() => setViewport("web")}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                viewport === "web" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              Web
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                viewport === "mobile" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              Mobile
            </button>
          </div>
        )}
      </div>
      <div className={isEmail ? "overflow-x-auto" : ""}>
        {render ? render() : (
          <div className="text-center py-8 text-zinc-500 text-sm">
            Preview not available for this channel
          </div>
        )}
      </div>
    </div>
  );
}
