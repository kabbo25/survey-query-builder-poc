"use client";

import type { FlatQuestion } from "@/lib/flatten-questions";
import type { VisibleWhenCondition } from "@/types/survey";

interface Edge {
  from: string;
  to: string;
  operator: string;
  value: string;
}

function extractEdges(
  fieldKey: string,
  vw: VisibleWhenCondition | VisibleWhenCondition[] | null
): Edge[] {
  if (!vw) return [];

  if (Array.isArray(vw)) {
    return vw.flatMap((c) => extractEdges(fieldKey, c));
  }

  if (vw.operator === "OR" && vw.conditions) {
    return vw.conditions.map((c) => ({
      from: c.fieldKey,
      to: fieldKey,
      operator: c.operator,
      value: Array.isArray(c.value) ? `[${c.value.length} values]` : String(c.value),
    }));
  }

  return [
    {
      from: vw.fieldKey,
      to: fieldKey,
      operator: vw.operator,
      value: Array.isArray(vw.value) ? `[${vw.value.length} values]` : String(vw.value),
    },
  ];
}

export function DependencyGraph({ questions }: { questions: FlatQuestion[] }) {
  const edges: Edge[] = [];
  const nodeSet = new Set<string>();

  for (const q of questions) {
    if (!q.visibleWhen) continue;
    const qEdges = extractEdges(q.fieldKey, q.visibleWhen);
    for (const e of qEdges) {
      edges.push(e);
      nodeSet.add(e.from);
      nodeSet.add(e.to);
    }
  }

  const nodes = Array.from(nodeSet);
  const questionMap = new Map(questions.map((q) => [q.fieldKey, q]));

  if (edges.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No dependency edges found in this section.
      </p>
    );
  }

  const parentNodes = new Set(edges.map((e) => e.from));
  const childNodes = new Set(edges.map((e) => e.to));
  const rootNodes = [...parentNodes].filter((n) => !childNodes.has(n));
  const leafNodes = [...childNodes].filter((n) => !parentNodes.has(n));
  const middleNodes = nodes.filter(
    (n) => !rootNodes.includes(n) && !leafNodes.includes(n)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500 font-medium">
        <div>Source Fields</div>
        <div>Intermediate</div>
        <div>Dependent Fields</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          {rootNodes.map((n) => {
            const q = questionMap.get(n);
            return (
              <div
                key={n}
                className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3"
              >
                <p className="text-xs font-mono text-blue-600 truncate">{n}</p>
                {q && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {q.questionEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          {middleNodes.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-300">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          ) : (
            middleNodes.map((n) => {
              const q = questionMap.get(n);
              return (
                <div
                  key={n}
                  className="rounded-lg border-2 border-purple-300 bg-purple-50 p-3"
                >
                  <p className="text-xs font-mono text-purple-600 truncate">{n}</p>
                  {q && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {q.questionEn}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2">
          {leafNodes.map((n) => {
            const q = questionMap.get(n);
            return (
              <div
                key={n}
                className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-3"
              >
                <p className="text-xs font-mono text-emerald-600 truncate">{n}</p>
                {q && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {q.questionEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
          Dependency Edges ({edges.length})
        </h4>
        <div className="space-y-1">
          {edges.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs bg-white rounded-lg border border-gray-100 px-3 py-2"
            >
              <span className="font-mono text-blue-600">{e.from}</span>
              <span className="text-gray-400">→</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                {e.operator}
              </span>
              <span className="text-gray-500 font-mono truncate">{e.value}</span>
              <span className="text-gray-400">→</span>
              <span className="font-mono text-emerald-600">{e.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
