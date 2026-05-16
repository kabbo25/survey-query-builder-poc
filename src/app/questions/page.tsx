"use client";

import { useState } from "react";
import { QLIST, TOTAL_QUESTIONS } from "@/lib/schema";
import { SidebarLayout } from "@/components/SidebarLayout";

const UI_LABELS: Record<number, string> = { 1: "Text", 2: "Number", 3: "Textarea", 4: "Checkbox", 5: "Radio", 6: "Dropdown", 7: "Multi-Select", 8: "Date", 9: "File", 10: "GPS" };
const DT_LABELS: Record<number, string> = { 1: "String", 2: "Integer", 3: "Decimal", 4: "Boolean", 7: "Enum", 8: "Multi-Enum", 15: "AutoID", 16: "Date", 17: "Lookup", 18: "GPS" };

import surveyData from "@/data/survey-schema.json";
import type { SurveySchema } from "@/types/survey";
const schema = surveyData as unknown as SurveySchema;
const sections = schema.consentYesSections;

export default function QuestionsPage() {
  const [selectedSection, setSelectedSection] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const allSectionOptions: { id: number; label: string }[] = [];
  for (const s of sections) {
    allSectionOptions.push({ id: s.id, label: s.sectionShortNameEn || s.sectionNameEn });
    for (const sub of s.subSections) {
      allSectionOptions.push({ id: sub.id, label: `${s.sectionShortNameEn} › ${sub.sectionShortNameEn || sub.sectionNameEn}` });
    }
  }

  const filtered = QLIST.filter((q) => {
    if (selectedSection !== "all" && q.sectionId !== selectedSection) return false;
    if (search && !q.questionEn.toLowerCase().includes(search.toLowerCase()) && !q.key.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SidebarLayout>
      <main className="page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div className="crumb-label">SURVEY · QUESTIONS</div>
            <h1 style={{ margin: "6px 0 4px" }}>Question List</h1>
            <div className="lede">{TOTAL_QUESTIONS} questions across {allSectionOptions.length} sections</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: 220, height: 36, paddingLeft: 12, fontSize: 13 }} />
            </div>
            <select value={selectedSection === "all" ? "all" : String(selectedSection)}
              onChange={(e) => setSelectedSection(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{ width: 220, height: 36, fontSize: 13 }}>
              <option value="all">All Sections</option>
              {allSectionOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  {["Q#", "FIELD KEY", "QUESTION (EN)", "SECTION", "TYPE", "UI ELEMENT", "OPTIONS", "REQUIRED", "CONDITIONAL"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700,
                      letterSpacing: ".06em", color: "var(--ink-3)", textTransform: "uppercase",
                      fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => {
                  const origQ = sections.flatMap((s) => [...s.questions, ...s.subSections.flatMap((sub) => sub.questions)]).find((oq) => oq.fieldKey === q.key);
                  const hasCondition = origQ?.visibleWhen != null;
                  return (
                    <tr key={q.key} style={{ borderBottom: "1px solid var(--line-2)", background: hasCondition ? "var(--warn-pale)" : undefined }}>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink-3)" }}>{q.qn}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <code style={{ fontSize: 12, background: "var(--line-2)", padding: "2px 6px", borderRadius: 4, color: "var(--accent-2)" }}>{q.key}</code>
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--ink)", maxWidth: 280 }}>{q.questionEn}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-3)" }}>{q.sectionEn}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 11, background: "var(--accent-soft)", color: "var(--accent-2)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                          {q.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-3)" }}>
                        {origQ ? (UI_LABELS[origQ.uiElementType] || origQ.uiElementType) : "-"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-3)" }}>
                        {q.options.length > 0 ? q.options.length : "-"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {origQ?.isRequired && (
                          <span style={{ fontSize: 11, background: "var(--danger-soft)", color: "var(--danger)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Yes</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {hasCondition && (
                          <span style={{ fontSize: 11, background: "var(--warn-soft)", color: "var(--warn)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Yes</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--line-2)", fontSize: 12.5, color: "var(--ink-3)" }}>
            Showing {filtered.length} of {TOTAL_QUESTIONS} questions
          </div>
        </div>
      </main>
    </SidebarLayout>
  );
}
