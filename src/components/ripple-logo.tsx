"use client";

interface RippleLogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: "default" | "compact";
  className?: string;
}

export function RippleLogo({
  size = 32,
  showWordmark = true,
  variant = "default",
  className = "",
}: RippleLogoProps) {
  return (
    <div
      className={`group/ripple flex items-center gap-2.5 ${className}`}
      style={{ color: "var(--foreground)" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <circle cx="16" cy="16" r="2.5" fill="var(--accent)" />
        <circle
          cx="16"
          cy="16"
          r="6"
          stroke="var(--accent)"
          strokeWidth="1.25"
          fill="none"
          className="origin-center group-hover/ripple:animate-[ripple-wave_1.2s_ease-in-out_0s]"
          style={{ "--ring-opacity": "0.85" } as React.CSSProperties}
          opacity="0.85"
        />
        <circle
          cx="16"
          cy="16"
          r="10"
          stroke="var(--accent)"
          strokeWidth="1"
          fill="none"
          className="origin-center group-hover/ripple:animate-[ripple-wave_1.2s_ease-in-out_0.15s]"
          style={{ "--ring-opacity": "0.55" } as React.CSSProperties}
          opacity="0.55"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="var(--accent)"
          strokeWidth="0.75"
          fill="none"
          className="origin-center group-hover/ripple:animate-[ripple-wave_1.2s_ease-in-out_0.3s]"
          style={{ "--ring-opacity": "0.3" } as React.CSSProperties}
          opacity="0.3"
        />
      </svg>
      {showWordmark && (
        <span
          className={`font-semibold text-[var(--foreground)] tracking-tight ${
            variant === "compact" ? "text-sm" : ""
          }`}
        >
          Ripple
        </span>
      )}
    </div>
  );
}
