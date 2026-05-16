"use client";

import { useState } from "react";
import surveyData from "@/data/survey-schema.json";
import type { SurveySchema, Section } from "@/types/survey";
import { flattenSections, type FlatQuestion } from "@/lib/flatten-questions";
import {
  QueryBuilder,
  QueryBuilderOutput,
  ExistingConditions,
  parseVisibleWhen,
  type QueryGroup,
} from "@/components/QueryBuilder";
import { SurveyFormPreview } from "@/components/SurveyFormPreview";
import { DependencyGraph } from "@/components/DependencyGraph";

const schema = surveyData as unknown as SurveySchema;
const allSections = schema.consentYesSections;
const allQuestions = flattenSections(allSections);

type TabId = "builder" | "conditions" | "preview" | "graph";

function getSectionLabel(section: Section, parent?: Section) {
  return parent
    ? `${parent.sectionShortNameEn} > ${section.sectionShortNameEn}`
    : section.sectionShortNameEn || section.sectionNameEn;
}

function getAllSectionOptions(sections: Section[]) {
  const opts: { id: number; label: string; labelBn: string }[] = [];
  for (const s of sections) {
    opts.push({
      id: s.id,
      label: s.sectionShortNameEn || s.sectionNameEn,
      labelBn: s.sectionShortNameBn || s.sectionNameBn,
    });
    for (const sub of s.subSections) {
      opts.push({
        id: sub.id,
        label: getSectionLabel(sub, s),
        labelBn: `${s.sectionShortNameBn} > ${sub.sectionShortNameBn}`,
      });
    }
  }
  return opts;
}

const sectionOptions = getAllSectionOptions(allSections);

function getQuestionsForSection(sectionId: number | "all"): FlatQuestion[] {
  if (sectionId === "all") return allQuestions;
  return allQuestions.filter((q) => q.sectionId === sectionId);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("builder");
  const [selectedSection, setSelectedSection] = useState<number | "all">("all");
  const [queryGroup, setQueryGroup] = useState<QueryGroup>({
    id: crypto.randomUUID(),
    combinator: "AND",
    rules: [
      {
        id: crypto.randomUUID(),
        fieldKey: "",
        operator: "Equals",
        value: "",
        dependsOn: "value",
      },
    ],
  });

  const sectionQuestions = getQuestionsForSection(selectedSection);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "builder",
      label: "Query Builder",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "conditions",
      label: "Existing Conditions",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: "preview",
      label: "Form Preview",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      id: "graph",
      label: "Dependency Graph",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">EARN Survey</h1>
                <p className="text-xs text-gray-500">Dynamic Query Builder POC</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Questions</p>
                <p className="text-sm font-bold text-gray-900">{allQuestions.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Sections</p>
                <p className="text-sm font-bold text-gray-900">{sectionOptions.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Conditional</p>
                <p className="text-sm font-bold text-amber-600">
                  {allQuestions.filter((q) => q.visibleWhen).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Section Filter + Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            value={selectedSection === "all" ? "all" : String(selectedSection)}
            onChange={(e) =>
              setSelectedSection(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">All Sections ({allQuestions.length} questions)</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({getQuestionsForSection(s.id).length})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "builder" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Build Visibility Condition
                  </h2>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    visibleWhen
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Configure when a question should be visible based on other field values.
                  Build complex AND/OR conditions, then copy the JSON output.
                </p>
                <QueryBuilder
                  questions={allQuestions}
                  value={queryGroup}
                  onChange={setQueryGroup}
                />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <QueryBuilderOutput group={queryGroup} />
              </div>
            </div>
          )}

          {activeTab === "conditions" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Existing Conditional Questions
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Questions with <code className="bg-gray-100 px-1 rounded">visibleWhen</code>{" "}
                conditions. Click to expand and edit.
              </p>
              <ExistingConditions
                questions={sectionQuestions}
                allQuestions={allQuestions}
              />
            </div>
          )}

          {activeTab === "preview" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <SurveyFormPreview
                questions={sectionQuestions}
                sectionName={
                  selectedSection === "all"
                    ? "All Questions"
                    : sectionOptions.find((s) => s.id === selectedSection)?.label ||
                      "Section"
                }
              />
            </div>
          )}

          {activeTab === "graph" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Question Dependency Graph
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Visual map of which questions depend on other questions via{" "}
                <code className="bg-gray-100 px-1 rounded">visibleWhen</code> conditions.
              </p>
              <DependencyGraph questions={sectionQuestions} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 text-center">
            EARN Survey — Dynamic Query Builder POC | Schema hash: {schema.hash}
          </p>
        </div>
      </footer>
    </div>
  );
}
