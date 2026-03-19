import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ripple — Braze Communications",
  description: "Recreate customer communications into Braze with standardized events, journeys, and documentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
