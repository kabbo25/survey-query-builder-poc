"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLabels, updateLabelStatus, deleteLabel, type SavedLabel } from "@/lib/store";
import { SidebarLayout } from "@/components/SidebarLayout";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "#e7f4ee", text: "#137a55", dot: "#137a55" },
  inactive: { bg: "#f3f3f3", text: "#6b7873", dot: "#9aa49f" },
  draft: { bg: "#fbf3df", text: "#8e6420", dot: "#b9852b" },
};

export default function ListPage() {
  const router = useRouter();
  const [labels, setLabels] = useState<SavedLabel[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLabels(getLabels());
  }, []);

  const filtered = labels.filter((l) => {
    if (filter === "active" && l.status !== "active") return false;
    if (filter === "inactive" && l.status !== "inactive") return false;
    if (search && !l.nameEn.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const activeCount = labels.filter((l) => l.status === "active").length;
  const inactiveCount = labels.filter((l) => l.status !== "active").length;

  const handleStatusToggle = (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    updateLabelStatus(id, newStatus as SavedLabel["status"]);
    setLabels(getLabels());
    setOpenMenu(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this label?")) {
      deleteLabel(id);
      setLabels(getLabels());
      setOpenMenu(null);
    }
  };

  return (
    <SidebarLayout>
      <main className="page">
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--line-2)", display: "grid", placeItems: "center", color: "var(--ink-3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 20 }}>Beneficiary Level Configuration</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn" style={{ gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              Export
            </button>
            <button className="btn primary" style={{ background: "#f0a825", borderColor: "#f0a825", fontWeight: 700, fontSize: 14, height: 40, padding: "0 20px" }}
              onClick={() => router.push("/new")}>
              + Add New Level
            </button>
          </div>
        </div>

        {/* Filter by status */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-body" style={{ padding: "14px 20px" }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginBottom: 10 }}>Filter by status</div>
            <div style={{ display: "flex", gap: 8 }}>
              {([
                ["all", `All (${labels.length})`],
                ["active", `Active (${activeCount})`],
                ["inactive", `Inactive (${inactiveCount})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setPage(1); }}
                  style={{
                    height: 32, padding: "0 14px", borderRadius: 999, border: "1px solid",
                    borderColor: filter === key ? "var(--accent)" : "var(--line)",
                    background: filter === key ? "var(--accent-soft)" : "#fff",
                    color: filter === key ? "var(--accent-2)" : "var(--ink-2)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "12px 20px", borderBottom: "1px solid var(--line-2)", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 32, width: 200, height: 34, fontSize: 13 }} />
            </div>
            <button className="icon-btn" title="Refresh" onClick={() => setLabels(getLabels())}>
              <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            </button>
            <button className="icon-btn" title="Column settings">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>
          </div>

          {/* Table header */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  {["LEVEL NAME ↑ ↓", "AGE RANGE", "EDUCATION", "EXPERIENCE (YEARS)", "BANGLA & ENGLISH", "COMPUTER SKILL", "MINORITY GROUP", "GENDER", "STATUS", "ACTIONS"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700,
                      letterSpacing: ".08em", color: "var(--ink-3)", textTransform: "uppercase",
                      fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "var(--ink-4)" }}>
                      {labels.length === 0
                        ? "No labels yet. Click \"+ Add New Level\" to create one."
                        : "No labels match the current filter."}
                    </td>
                  </tr>
                ) : (
                  paged.map((label) => {
                    const sc = STATUS_COLORS[label.status] || STATUS_COLORS.draft;
                    return (
                      <tr key={label.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink)" }}>{label.nameEn}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.ageRange}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.education}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.experience}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.banglaEnglish}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.computerSkill}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.minorityGroup}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>{label.summary.gender}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "4px 12px", borderRadius: 999,
                            background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 600,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
                            {label.status.charAt(0).toUpperCase() + label.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", position: "relative" }}>
                          <button
                            className="btn ghost"
                            style={{ fontSize: 12 }}
                            onClick={() => setOpenMenu(openMenu === label.id ? null : label.id)}
                          >
                            Manage ▾
                          </button>
                          {openMenu === label.id && (
                            <div style={{
                              position: "absolute", right: 16, top: "100%", zIndex: 50,
                              background: "#fff", border: "1px solid var(--line)",
                              borderRadius: 9, boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                              padding: 4, minWidth: 140,
                            }}>
                              <button onClick={() => handleStatusToggle(label.id, label.status)} style={{
                                display: "block", width: "100%", padding: "7px 10px", border: 0,
                                background: "transparent", borderRadius: 5, fontSize: 13, fontWeight: 500,
                                color: "var(--ink-2)", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                              }}>
                                {label.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                              <hr style={{ border: 0, borderTop: "1px solid var(--line-2)", margin: "4px 2px" }} />
                              <button onClick={() => handleDelete(label.id)} style={{
                                display: "block", width: "100%", padding: "7px 10px", border: 0,
                                background: "transparent", borderRadius: 5, fontSize: 13, fontWeight: 500,
                                color: "var(--danger)", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                              }}>
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 20px", borderTop: "1px solid var(--line-2)", fontSize: 12.5, color: "var(--ink-3)",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>Total <b style={{ color: "var(--ink-2)", fontWeight: 600 }}>{filtered.length}</b> records</span>
              <span style={{ color: "var(--line)" }}>|</span>
              <span>Showing {Math.min((page - 1) * rowsPerPage + 1, filtered.length)}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} records</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>Rows:</span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                style={{ width: 60, height: 28, fontSize: 12 }}>
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>Page:</span>
              <select value={page} onChange={(e) => setPage(Number(e.target.value))}
                style={{ width: 50, height: 28, fontSize: 12 }}>
                {Array.from({ length: totalPages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
              <span>of {totalPages} pages</span>
              <div style={{ display: "flex", gap: 2 }}>
                {["«", "‹", "›", "»"].map((sym, i) => {
                  const target = i === 0 ? 1 : i === 1 ? Math.max(1, page - 1) : i === 2 ? Math.min(totalPages, page + 1) : totalPages;
                  return (
                    <button key={sym} onClick={() => setPage(target)}
                      style={{
                        width: 28, height: 28, border: "1px solid var(--line)", borderRadius: 6,
                        background: page === target && (i === 0 || i === 3) ? "var(--accent)" : "#fff",
                        color: page === target && (i === 0 || i === 3) ? "#fff" : "var(--ink-3)",
                        cursor: "pointer", fontSize: 13, display: "grid", placeItems: "center", fontFamily: "inherit",
                      }}>
                      {sym}
                    </button>
                  );
                })}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    style={{
                      width: 28, height: 28, border: "1px solid",
                      borderColor: page === i + 1 ? "var(--accent)" : "var(--line)",
                      borderRadius: 6,
                      background: page === i + 1 ? "var(--accent)" : "#fff",
                      color: page === i + 1 ? "#fff" : "var(--ink-3)",
                      cursor: "pointer", fontSize: 12, fontWeight: 600, display: "grid", placeItems: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </SidebarLayout>
  );
}
