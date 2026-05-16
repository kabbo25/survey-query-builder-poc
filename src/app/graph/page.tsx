"use client";

import { useState } from "react";
import surveyData from "@/data/survey-schema.json";
import type { SurveySchema, VisibleWhenCondition } from "@/types/survey";
import { TOTAL_QUESTIONS } from "@/lib/schema";
import { SidebarLayout } from "@/components/SidebarLayout";

const schema = surveyData as unknown as SurveySchema;
const sections = schema.consentYesSections;

interface Edge { from: string; to: string; operator: string; value: string; section: string; }

function extractEdges(fieldKey: string, section: string, vw: VisibleWhenCondition | VisibleWhenCondition[] | null): Edge[] {
  if (!vw) return [];
  if (Array.isArray(vw)) return vw.flatMap((c) => extractEdges(fieldKey, section, c));
  if (vw.operator === "OR" && vw.conditions) {
    return vw.conditions.map((c) => ({
      from: c.fieldKey, to: fieldKey, operator: c.operator,
      value: Array.isArray(c.value) ? `[${(c.value as (string|number)[]).length}]` : String(c.value), section,
    }));
  }
  return [{ from: vw.fieldKey, to: fieldKey, operator: vw.operator,
    value: Array.isArray(vw.value) ? `[${(vw.value as (string|number)[]).length}]` : String(vw.value), section }];
}

const allEdges: Edge[] = [];
for (const s of sections) {
  for (const q of s.questions) {
    allEdges.push(...extractEdges(q.fieldKey, s.sectionNameEn, q.visibleWhen as VisibleWhenCondition | VisibleWhenCondition[] | null));
  }
  for (const sub of s.subSections) {
    for (const q of sub.questions) {
      allEdges.push(...extractEdges(q.fieldKey, `${s.sectionShortNameEn} › ${sub.sectionNameEn}`, q.visibleWhen as VisibleWhenCondition | VisibleWhenCondition[] | null));
    }
  }
}

const nodeSet = new Set<string>();
allEdges.forEach((e) => { nodeSet.add(e.from); nodeSet.add(e.to); });
const parentNodes = new Set(allEdges.map((e) => e.from));
const childNodes = new Set(allEdges.map((e) => e.to));
const rootNodes = [...parentNodes].filter((n) => !childNodes.has(n));
const leafNodes = [...childNodes].filter((n) => !parentNodes.has(n));
const middleNodes = [...nodeSet].filter((n) => !rootNodes.includes(n) && !leafNodes.includes(n));

const sectionSet = new Set(allEdges.map((e) => e.section));

export default function GraphPage() {
  const [filterSection, setFilterSection] = useState<string>("all");
  const [highlight, setHighlight] = useState<string | null>(null);

  const edges = filterSection === "all" ? allEdges : allEdges.filter((e) => e.section === filterSection);
  const filteredNodes = new Set<string>();
  edges.forEach((e) => { filteredNodes.add(e.from); filteredNodes.add(e.to); });

  const fRoots = rootNodes.filter((n) => filteredNodes.has(n));
  const fMiddle = middleNodes.filter((n) => filteredNodes.has(n));
  const fLeaves = leafNodes.filter((n) => filteredNodes.has(n));

  const highlightEdges = highlight ? edges.filter((e) => e.from === highlight || e.to === highlight) : [];
  const highlightNodes = new Set<string>();
  highlightEdges.forEach((e) => { highlightNodes.add(e.from); highlightNodes.add(e.to); });

  function NodeBox({ fieldKey, color, borderColor }: { fieldKey: string; color: string; borderColor: string }) {
    const isHighlighted = !highlight || highlightNodes.has(fieldKey);
    return (
      <div
        onClick={() => setHighlight(highlight === fieldKey ? null : fieldKey)}
        style={{
          padding: "8px 12px", borderRadius: 8, border: `2px solid ${borderColor}`,
          background: color, cursor: "pointer", transition: "all .12s",
          opacity: highlight && !isHighlighted ? 0.3 : 1,
          transform: highlight === fieldKey ? "scale(1.05)" : "none",
          boxShadow: highlight === fieldKey ? `0 4px 12px ${borderColor}40` : "none",
        }}
      >
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: borderColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fieldKey}
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <main className="page">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div className="crumb-label">SURVEY · DEPENDENCIES</div>
            <h1 style={{ margin: "6px 0 4px" }}>Dependency Graph</h1>
            <div className="lede">{allEdges.length} dependency edges across {nodeSet.size} fields</div>
          </div>
          <select value={filterSection} onChange={(e) => { setFilterSection(e.target.value); setHighlight(null); }}
            style={{ width: 260, height: 36, fontSize: 13 }}>
            <option value="all">All Sections ({allEdges.length} edges)</option>
            {[...sectionSet].map((s) => <option key={s} value={s}>{s} ({allEdges.filter((e) => e.section === s).length})</option>)}
          </select>
        </div>

        {/* Three-column graph */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, textAlign: "center", fontSize: 10, color: "var(--ink-4)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              <div>Source Fields ({fRoots.length})</div>
              <div>Intermediate ({fMiddle.length})</div>
              <div>Dependent Fields ({fLeaves.length})</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fRoots.map((n) => <NodeBox key={n} fieldKey={n} color="var(--accent-pale)" borderColor="var(--accent)" />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", justifyContent: "center" }}>
                {fMiddle.length === 0 ? (
                  <div style={{ color: "var(--ink-4)", padding: 20 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </div>
                ) : fMiddle.map((n) => <NodeBox key={n} fieldKey={n} color="#f5f0ff" borderColor="#7c3aed" />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fLeaves.map((n) => <NodeBox key={n} fieldKey={n} color="var(--warn-pale)" borderColor="var(--warn)" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Edge list */}
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ink-3)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700 }}>
              Dependency Edges ({edges.length})
            </span>
            {highlight && (
              <button onClick={() => setHighlight(null)} className="btn ghost" style={{ fontSize: 11, height: 28 }}>
                Clear highlight
              </button>
            )}
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {edges.map((e, i) => {
              const isHL = !highlight || highlightNodes.has(e.from) || highlightNodes.has(e.to);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 20px",
                  borderBottom: "1px solid var(--line-2)", fontSize: 12,
                  opacity: highlight && !isHL ? 0.25 : 1, transition: "opacity .12s",
                }}>
                  <code style={{ color: "var(--accent-2)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{e.from}</code>
                  <span style={{ color: "var(--ink-4)" }}>→</span>
                  <span style={{ background: "var(--line-2)", padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "var(--ink-3)" }}>{e.operator}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)" }}>{e.value}</span>
                  <span style={{ color: "var(--ink-4)" }}>→</span>
                  <code style={{ color: "var(--warn)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{e.to}</code>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-4)" }}>{e.section}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </SidebarLayout>
  );
}
