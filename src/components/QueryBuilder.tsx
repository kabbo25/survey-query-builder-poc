"use client";

import { useState } from "react";
import type { FlatQuestion, } from "@/lib/flatten-questions";
import { getFieldOptions } from "@/lib/flatten-questions";
import type { VisibleWhenCondition } from "@/types/survey";

const OPERATORS = [
  { value: "Equals", label: "Equals" },
  { value: "NotEquals", label: "Not Equals" },
  { value: "In", label: "In (any of)" },
  { value: "NotIn", label: "Not In" },
  { value: "Contains", label: "Contains" },
  { value: "GreaterThan", label: "Greater Than" },
  { value: "LessThan", label: "Less Than" },
];

const DEPENDS_ON = [
  { value: "value", label: "Value" },
  { value: "age", label: "Age (computed)" },
  { value: "labelEn", label: "Label (EN)" },
  { value: "labelBn", label: "Label (BN)" },
];

export interface QueryRule {
  id: string;
  fieldKey: string;
  operator: string;
  value: string;
  dependsOn: string;
}

export interface QueryGroup {
  id: string;
  combinator: "AND" | "OR";
  rules: (QueryRule | QueryGroup)[];
}

function isGroup(item: QueryRule | QueryGroup): item is QueryGroup {
  return "combinator" in item;
}

function newRule(): QueryRule {
  return {
    id: crypto.randomUUID(),
    fieldKey: "",
    operator: "Equals",
    value: "",
    dependsOn: "value",
  };
}

function newGroup(): QueryGroup {
  return {
    id: crypto.randomUUID(),
    combinator: "AND",
    rules: [newRule()],
  };
}

export function parseVisibleWhen(
  vw: VisibleWhenCondition | VisibleWhenCondition[] | null
): QueryGroup | null {
  if (!vw) return null;

  if (Array.isArray(vw)) {
    return {
      id: crypto.randomUUID(),
      combinator: "AND",
      rules: vw.map((c) => ({
        id: crypto.randomUUID(),
        fieldKey: c.fieldKey,
        operator: c.operator,
        value: Array.isArray(c.value) ? c.value.join(", ") : String(c.value),
        dependsOn: c.dependsOn || "value",
      })),
    };
  }

  if (vw.operator === "OR" && vw.conditions) {
    return {
      id: crypto.randomUUID(),
      combinator: "OR",
      rules: vw.conditions.map((c) => ({
        id: crypto.randomUUID(),
        fieldKey: c.fieldKey,
        operator: c.operator,
        value: Array.isArray(c.value) ? c.value.join(", ") : String(c.value),
        dependsOn: c.dependsOn || "value",
      })),
    };
  }

  return {
    id: crypto.randomUUID(),
    combinator: "AND",
    rules: [
      {
        id: crypto.randomUUID(),
        fieldKey: vw.fieldKey,
        operator: vw.operator,
        value: Array.isArray(vw.value) ? vw.value.join(", ") : String(vw.value),
        dependsOn: vw.dependsOn || "value",
      },
    ],
  };
}

function RuleEditor({
  rule,
  questions,
  onChange,
  onRemove,
}: {
  rule: QueryRule;
  questions: FlatQuestion[];
  onChange: (r: QueryRule) => void;
  onRemove: () => void;
}) {
  const fieldOptions = getFieldOptions(questions);
  const selectedField = questions.find((q) => q.fieldKey === rule.fieldKey);
  const hasOptions = selectedField?.options && selectedField.options.length > 0;

  return (
    <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <select
        className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={rule.fieldKey}
        onChange={(e) => onChange({ ...rule, fieldKey: e.target.value, value: "" })}
      >
        <option value="">Select field...</option>
        {fieldOptions.map((f) => (
          <option key={f.value} value={f.value}>
            [{f.sectionEn}] {f.label}
          </option>
        ))}
      </select>

      <select
        className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
        value={rule.operator}
        onChange={(e) => onChange({ ...rule, operator: e.target.value })}
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {hasOptions ? (
        <select
          className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          value={rule.value}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
        >
          <option value="">Select value...</option>
          {selectedField!.options!.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.labelEn} ({opt.value})
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="Value..."
          value={rule.value}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
        />
      )}

      <select
        className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
        value={rule.dependsOn}
        onChange={(e) => onChange({ ...rule, dependsOn: e.target.value })}
      >
        {DEPENDS_ON.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      <button
        onClick={onRemove}
        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
        title="Remove rule"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function GroupEditor({
  group,
  questions,
  onChange,
  onRemove,
  depth,
}: {
  group: QueryGroup;
  questions: FlatQuestion[];
  onChange: (g: QueryGroup) => void;
  onRemove: (() => void) | null;
  depth: number;
}) {
  const borderColors = [
    "border-blue-400",
    "border-purple-400",
    "border-emerald-400",
    "border-amber-400",
  ];
  const bgColors = [
    "bg-blue-50/50",
    "bg-purple-50/50",
    "bg-emerald-50/50",
    "bg-amber-50/50",
  ];
  const borderColor = borderColors[depth % borderColors.length];
  const bgColor = bgColors[depth % bgColors.length];

  const updateRule = (index: number, updated: QueryRule | QueryGroup) => {
    const newRules = [...group.rules];
    newRules[index] = updated;
    onChange({ ...group, rules: newRules });
  };

  const removeRule = (index: number) => {
    const newRules = group.rules.filter((_, i) => i !== index);
    onChange({ ...group, rules: newRules });
  };

  return (
    <div className={`rounded-xl border-2 ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          {(["AND", "OR"] as const).map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...group, combinator: c })}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                group.combinator === c
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-500 font-medium">
          {group.rules.length} rule{group.rules.length !== 1 ? "s" : ""}
        </span>

        <div className="flex-1" />

        <button
          onClick={() => onChange({ ...group, rules: [...group.rules, newRule()] })}
          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          + Rule
        </button>
        <button
          onClick={() => onChange({ ...group, rules: [...group.rules, newGroup()] })}
          className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
        >
          + Group
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-2">
        {group.rules.map((item, i) => (
          <div key={isGroup(item) ? item.id : item.id}>
            {i > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs font-bold text-gray-400">{group.combinator}</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
            )}
            {isGroup(item) ? (
              <GroupEditor
                group={item}
                questions={questions}
                onChange={(g) => updateRule(i, g)}
                onRemove={() => removeRule(i)}
                depth={depth + 1}
              />
            ) : (
              <RuleEditor
                rule={item}
                questions={questions}
                onChange={(r) => updateRule(i, r)}
                onRemove={() => removeRule(i)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueryBuilder({
  questions,
  value,
  onChange,
  label,
}: {
  questions: FlatQuestion[];
  value: QueryGroup;
  onChange: (g: QueryGroup) => void;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      )}
      <GroupEditor
        group={value}
        questions={questions}
        onChange={onChange}
        onRemove={null}
        depth={0}
      />
    </div>
  );
}

export function QueryBuilderOutput({ group }: { group: QueryGroup }) {
  const toJson = (g: QueryGroup): unknown => {
    if (g.rules.length === 1 && !isGroup(g.rules[0])) {
      const r = g.rules[0] as QueryRule;
      if (!r.fieldKey) return null;
      const val = r.value.includes(",")
        ? r.value.split(",").map((v) => v.trim())
        : r.value;
      return {
        fieldKey: r.fieldKey,
        operator: r.operator,
        value: val,
        dependsOn: r.dependsOn,
      };
    }

    const mapped = g.rules
      .map((item) => {
        if (isGroup(item)) return toJson(item);
        if (!item.fieldKey) return null;
        const val = item.value.includes(",")
          ? item.value.split(",").map((v: string) => v.trim())
          : item.value;
        return {
          fieldKey: item.fieldKey,
          operator: item.operator,
          value: val,
          dependsOn: item.dependsOn,
        };
      })
      .filter(Boolean);

    if (mapped.length === 0) return null;
    if (mapped.length === 1) return mapped[0];

    if (g.combinator === "OR") {
      return { operator: "OR", conditions: mapped };
    }
    return mapped;
  };

  const output = toJson(group);

  return (
    <div className="rounded-xl bg-gray-900 p-4 overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          visibleWhen JSON Output
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(output, null, 2))}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">
        {JSON.stringify(output, null, 2) || "null"}
      </pre>
    </div>
  );
}

export function ExistingConditions({
  questions,
  allQuestions,
}: {
  questions: FlatQuestion[];
  allQuestions: FlatQuestion[];
}) {
  const withConditions = questions.filter((q) => q.visibleWhen);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editGroup, setEditGroup] = useState<QueryGroup | null>(null);

  if (withConditions.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No conditional questions in this section.</p>
    );
  }

  return (
    <div className="space-y-2">
      {withConditions.map((q) => {
        const isExpanded = expandedId === q.id;
        return (
          <div
            key={q.id}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
          >
            <button
              onClick={() => {
                if (isExpanded) {
                  setExpandedId(null);
                  setEditGroup(null);
                } else {
                  setExpandedId(q.id);
                  setEditGroup(parseVisibleWhen(q.visibleWhen));
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  Q{q.questionNumber}
                </span>
                <div>
                  <span className="text-sm font-medium text-gray-900">{q.questionEn}</span>
                  <span className="ml-2 text-xs text-gray-500 font-mono">{q.fieldKey}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {Array.isArray(q.visibleWhen)
                    ? `${q.visibleWhen.length} conditions`
                    : "1 condition"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && editGroup && (
              <div className="border-t border-gray-200 px-4 py-4 space-y-4 bg-gray-50/50">
                <QueryBuilder
                  questions={allQuestions}
                  value={editGroup}
                  onChange={setEditGroup}
                  label="Edit Visibility Condition"
                />
                <QueryBuilderOutput group={editGroup} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
