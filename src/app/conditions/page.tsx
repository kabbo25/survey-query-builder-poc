"use client";

import { useState } from "react";
import surveyData from "@/data/survey-schema.json";
import type { SurveySchema, Question, VisibleWhenCondition } from "@/types/survey";
import { TOTAL_QUESTIONS } from "@/lib/schema";
import { SidebarLayout } from "@/components/SidebarLayout";

const schema = surveyData as unknown as SurveySchema;
const sections = schema.consentYesSections;

interface ConditionQ {
  fieldKey: string;
  questionEn: string;
  questionNumber: number;
  sectionName: string;
  visibleWhen: VisibleWhenCondition | VisibleWhenCondition[];
}

const conditionalQuestions: ConditionQ[] = [];
for (const s of sections) {
  for (const q of s.questions) {
    if (q.visibleWhen) conditionalQuestions.push({ fieldKey: q.fieldKey, questionEn: q.questionEn, questionNumber: q.questionNumber, sectionName: s.sectionNameEn, visibleWhen: q.visibleWhen as VisibleWhenCondition | VisibleWhenCondition[] });
  }
  for (const sub of s.subSections) {
    for (const q of sub.questions) {
      if (q.visibleWhen) conditionalQuestions.push({ fieldKey: q.fieldKey, questionEn: q.questionEn, questionNumber: q.questionNumber, sectionName: `${s.sectionShortNameEn} › ${sub.sectionNameEn}`, visibleWhen: q.visibleWhen as VisibleWhenCondition | VisibleWhenCondition[] });
    }
  }
}

function ConditionBadge({ vw }: { vw: VisibleWhenCondition }) {
  const valStr = Array.isArray(vw.value) ? `[${(vw.value as (string | number)[]).length} values]` : String(vw.value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, flexWrap: "wrap" }}>
      <code style={{ background: "var(--accent-soft)", color: "var(--accent-2)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{vw.fieldKey}</code>
      <span style={{ fontWeight: 700, color: "var(--ink-3)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{vw.operator}</span>
      <span style={{ background: "var(--line-2)", padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink)" }}>{valStr}</span>
      {vw.dependsOn && vw.dependsOn !== "value" && (
        <span style={{ fontSize: 10, color: "var(--ink-4)", fontStyle: "italic" }}>({vw.dependsOn})</span>
      )}
    </div>
  );
}

export default function ConditionsPage() {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <SidebarLayout>
      <main className="page">
        <div style={{ marginBottom: 18 }}>
          <div className="crumb-label">SURVEY · CONDITIONS</div>
          <h1 style={{ margin: "6px 0 4px" }}>Existing Conditions</h1>
          <div className="lede">{conditionalQuestions.length} questions with visibleWhen conditions out of {TOTAL_QUESTIONS} total</div>
        </div>

        <div className="card">
          {conditionalQuestions.map((cq) => {
            const isExpanded = expandedKey === cq.fieldKey;
            const vwArray = Array.isArray(cq.visibleWhen) ? cq.visibleWhen : [cq.visibleWhen];
            const isOR = !Array.isArray(cq.visibleWhen) && (cq.visibleWhen as VisibleWhenCondition).operator === "OR";

            return (
              <div key={cq.fieldKey} style={{ borderBottom: "1px solid var(--line-2)" }}>
                <button onClick={() => setExpandedKey(isExpanded ? null : cq.fieldKey)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 20px", border: 0, background: isExpanded ? "var(--accent-pale)" : "transparent",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background .12s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%", background: "var(--warn-soft)",
                      color: "var(--warn)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>Q{cq.questionNumber}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{cq.questionEn}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>
                        <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{cq.fieldKey}</code>
                        <span style={{ margin: "0 6px", color: "var(--line)" }}>·</span>
                        {cq.sectionName}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11, background: "var(--accent-soft)", color: "var(--accent-2)",
                      padding: "3px 10px", borderRadius: 999, fontWeight: 600,
                    }}>
                      {vwArray.length} condition{vwArray.length !== 1 ? "s" : ""}
                      {isOR ? " (OR)" : vwArray.length > 1 ? " (AND)" : ""}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ padding: "12px 20px 16px 58px", background: "var(--accent-pale)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {isOR && (cq.visibleWhen as VisibleWhenCondition).conditions ? (
                        (cq.visibleWhen as VisibleWhenCondition).conditions!.map((c, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {i > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "var(--accent-2)", background: "var(--accent-soft)", padding: "1px 6px", borderRadius: 4 }}>OR</span>}
                            <ConditionBadge vw={c} />
                          </div>
                        ))
                      ) : (
                        vwArray.map((c, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {i > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "var(--accent-2)", background: "var(--accent-soft)", padding: "1px 6px", borderRadius: 4 }}>AND</span>}
                            <ConditionBadge vw={c} />
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ marginTop: 12, padding: "8px 12px", background: "#1a1f1d", borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: "#6b7873", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: ".06em", textTransform: "uppercase" }}>RAW JSON</div>
                      <pre style={{ margin: 0, fontSize: 11, color: "#7dd3a8", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                        {JSON.stringify(cq.visibleWhen, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </SidebarLayout>
  );
}
