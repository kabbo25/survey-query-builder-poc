import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create Label — Query Builder",
  description: "EARN·EMS Survey Label Query Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="mode-selection">{children}</body>
    </html>
  );
}
