"use client";

import { Sidebar } from "./Sidebar";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="dot" />
          <div className="bname">EARN<span>·</span>EMS</div>
        </div>
        <nav className="crumbs">
          <span>Survey</span><span className="sep">/</span>
          <span className="cur">Configuration</span>
        </nav>
        <div className="spacer" />
        <button className="icon-btn" title="Help">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.7.5-1.5 1-1.5 2" /><path d="M12 17h.01" /></svg>
        </button>
        <div className="avatar">RA</div>
      </header>
      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </>
  );
}
