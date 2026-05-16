"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Labels",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.5" /></svg>
    ),
  },
  {
    href: "/questions",
    label: "Question List",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    ),
  },
  {
    href: "/conditions",
    label: "Existing Conditions",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    ),
  },
  {
    href: "/graph",
    label: "Dependency Graph",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: "#fff", borderRight: "1px solid var(--line)",
      padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4,
      position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".08em",
        color: "var(--ink-4)", textTransform: "uppercase", padding: "8px 10px 4px", fontWeight: 600,
      }}>
        Survey Tools
      </div>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600,
            color: isActive ? "var(--accent-2)" : "var(--ink-2)",
            background: isActive ? "var(--accent-soft)" : "transparent",
            transition: "all .12s",
          }}>
            <span style={{
              width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
              color: isActive ? "var(--accent)" : "var(--ink-3)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {item.icon.props.children}
              </svg>
            </span>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
