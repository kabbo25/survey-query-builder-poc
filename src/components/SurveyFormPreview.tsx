"use client";

import type { FlatQuestion } from "@/lib/flatten-questions";

const UI_ELEMENT_LABELS: Record<number, string> = {
  1: "Text Input",
  2: "Number Input",
  3: "Textarea",
  4: "Checkbox",
  5: "Radio Group",
  6: "Dropdown",
  7: "Multi-Select",
  8: "Date Picker",
  9: "File Upload",
  10: "GPS Capture",
};

const DATA_TYPE_LABELS: Record<number, string> = {
  1: "String",
  2: "Integer",
  3: "Decimal",
  4: "Boolean",
  7: "Enum (Single)",
  8: "Enum (Multi)",
  15: "Auto ID",
  16: "Date",
  17: "Lookup",
  18: "GPS Coordinate",
};

function QuestionCard({ question }: { question: FlatQuestion }) {
  const hasCondition = !!question.visibleWhen;
  const hasOptions = question.options && question.options.length > 0;

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        hasCondition
          ? "border-amber-300 bg-amber-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-bold shrink-0">
            {question.questionNumber}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {question.questionEn}
            </p>
            <p className="text-xs text-gray-500 truncate">{question.questionBn}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {question.isRequired && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
              Required
            </span>
          )}
          {question.isReadOnly && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
              Read-only
            </span>
          )}
          {hasCondition && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
              Conditional
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
          {question.fieldKey}
        </span>
        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
          {UI_ELEMENT_LABELS[question.uiElementType] || `UI:${question.uiElementType}`}
        </span>
        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
          {DATA_TYPE_LABELS[question.dataType] || `Type:${question.dataType}`}
        </span>
      </div>

      {hasOptions && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">
            Options ({question.options!.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {question.options!.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
              >
                <span className="font-mono text-gray-400">{opt.value}</span>
                {opt.labelEn}
              </span>
            ))}
          </div>
        </div>
      )}

      {question.hintEn && (
        <p className="mt-2 text-xs text-gray-400 italic">{question.hintEn}</p>
      )}
    </div>
  );
}

export function SurveyFormPreview({
  questions,
  sectionName,
}: {
  questions: FlatQuestion[];
  sectionName: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{sectionName}</h3>
        <span className="text-sm text-gray-500">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
