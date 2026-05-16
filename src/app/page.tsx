"use client";

import { useState, useRef, useEffect } from "react";
import { QLIST, QBY, TOTAL_QUESTIONS, type FlatQ } from "@/lib/schema";

// ========== OPERATORS ==========
const OPS: Record<string, [string, string][]> = {
  num: [["=", "equals"], ["!=", "not equal"], [">", "greater than"], ["<", "less than"], [">=", "at least"], ["<=", "at most"], ["between", "between"], ["not_between", "not between"]],
  date: [["=", "on"], ["<", "before"], [">", "after"], ["between", "between"], ["last_n_days", "in last N days"]],
  yn: [["=", "is"]],
  select: [["in", "is any of"], ["not_in", "is none of"], ["=", "equals"]],
  multi: [["contains_any", "contains any of"], ["contains_all", "contains all of"], ["contains_none", "contains none of"]],
  text: [["contains", "contains"], ["equals", "equals"], ["starts", "starts with"], ["empty", "is empty"], ["not_empty", "is not empty"]],
  mono: [["equals", "equals"], ["contains", "contains"], ["empty", "is empty"], ["not_empty", "is not empty"]],
};

const YN_OPTS = ["Yes", "No"];

// ========== STATE TYPES ==========
type RuleNode = { id: string; type: "rule"; qkey: string; op: string; value: unknown };
type GroupNode = { id: string; type: "group"; conj: "and" | "or"; children: (RuleNode | GroupNode)[] };
type Node = RuleNode | GroupNode;

let _uid = 1;
const nextId = () => "n" + _uid++;

function newRule(): RuleNode {
  return { id: nextId(), type: "rule", qkey: "", op: "", value: null };
}

function defaultOp(q: FlatQ | undefined) {
  if (!q) return "";
  return (OPS[q.type] || OPS.text)[0][0];
}

function defaultValue(q: FlatQ | undefined, op: string) {
  if (!q) return null;
  if (q.type === "yn") return "Yes";
  if (q.type === "select") return (op === "in" || op === "not_in") ? [] : (q.options?.[0] || "");
  if (q.type === "multi") return [];
  if (op === "between" || op === "not_between") return ["", ""];
  if (op === "empty" || op === "not_empty") return null;
  return "";
}

function valueComplete(rule: RuleNode): boolean {
  if (!rule.qkey || !rule.op) return false;
  if (rule.op === "empty" || rule.op === "not_empty") return true;
  const q = QBY[rule.qkey];
  if (!q) return false;
  const v = rule.value;
  if (rule.op === "between" || rule.op === "not_between") {
    return Array.isArray(v) && v[0] !== "" && v[1] !== "" && v[0] != null && v[1] != null;
  }
  if (q.type === "select" && (rule.op === "in" || rule.op === "not_in")) return Array.isArray(v) && v.length > 0;
  if (q.type === "multi") return Array.isArray(v) && v.length > 0;
  return v != null && v !== "";
}

function countStats(node: Node): { rules: number; groups: number; qused: number; invalid: number; qkeys: Set<string> } {
  const acc = { rules: 0, groups: 0, qused: 0, invalid: 0, qkeys: new Set<string>() };
  function walk(n: Node) {
    if (n.type === "group") {
      acc.groups++;
      n.children.forEach(walk);
    } else {
      acc.rules++;
      if (n.qkey) acc.qkeys.add(n.qkey);
      if (!n.qkey || !n.op || !valueComplete(n)) acc.invalid++;
    }
  }
  walk(node);
  acc.qused = acc.qkeys.size;
  return acc;
}

function labelOf(key: string) {
  return key.replace(/_/g, " ").replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bBn\b/, "(BN)").replace(/\bEn\b/, "(EN)")
    .replace(/\bNid\b/, "NID").replace(/\bGps\b/, "GPS").replace(/\bHh\b/, "HH").replace(/\bMfs\b/, "MFS");
}

// ========== CHIP PICKER ==========
function ChipPicker({ selected, options, onToggle, onClose }: {
  selected: Set<string>; options: string[]; onToggle: (v: string) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="picker" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div className="search-wrap">
        <input type="text" placeholder="Search options…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
      </div>
      {filtered.map((o) => (
        <div key={o} className={`opt ${selected.has(o) ? "on" : ""}`} onClick={() => onToggle(o)}>
          <span className="cb">
            {selected.has(o) && <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
          </span>
          <span>{o}</span>
        </div>
      ))}
    </div>
  );
}

// ========== VALUE CELL ==========
function ValueCell({ rule, onChange }: { rule: RuleNode; onChange: (v: unknown) => void }) {
  const q = rule.qkey ? QBY[rule.qkey] : undefined;
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!q || !rule.op) return <span className="none">Select a question and operator</span>;
  if (rule.op === "empty" || rule.op === "not_empty") return <span className="none">No value needed</span>;

  if (q.type === "yn") {
    return (
      <select value={String(rule.value ?? "Yes")} onChange={(e) => onChange(e.target.value)}>
        {YN_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (rule.op === "between" || rule.op === "not_between") {
    const [a = "", b = ""] = (rule.value as string[]) || ["", ""];
    const inputType = q.type === "date" ? "date" : "number";
    return (
      <>
        <input type={inputType} value={a} placeholder={q.type === "num" ? "min" : "from"}
          onChange={(e) => onChange([e.target.value, b])} />
        <span className="between-sep">to</span>
        <input type={inputType} value={b} placeholder={q.type === "num" ? "max" : "to"}
          onChange={(e) => onChange([a, e.target.value])} />
      </>
    );
  }

  if (rule.op === "last_n_days") {
    return (
      <>
        <input type="number" value={String(rule.value ?? "")} placeholder="days"
          onChange={(e) => onChange(e.target.value)} />
        <span className="between-sep">days</span>
      </>
    );
  }

  if (q.type === "num") {
    return <input type="number" value={String(rule.value ?? "")} placeholder="enter number"
      onChange={(e) => onChange(e.target.value)} />;
  }

  if (q.type === "date") {
    return <input type="date" value={String(rule.value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }

  if ((q.type === "select" && (rule.op === "in" || rule.op === "not_in")) || q.type === "multi") {
    const sel = new Set(Array.isArray(rule.value) ? (rule.value as string[]) : []);
    return (
      <div className="chips-input" tabIndex={0} onClick={() => setPickerOpen(true)}>
        {[...sel].map((s) => (
          <span key={s} className="chip">
            {s}
            <button className="x" onClick={(e) => { e.stopPropagation(); const next = new Set(sel); next.delete(s); onChange([...next]); }}>×</button>
          </span>
        ))}
        <button className="add-chip" onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}>+ ADD OPTION</button>
        {pickerOpen && (
          <ChipPicker
            selected={sel}
            options={q.options}
            onToggle={(v) => {
              const next = new Set(sel);
              if (next.has(v)) next.delete(v); else next.add(v);
              onChange([...next]);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    );
  }

  if (q.type === "select" && rule.op === "=") {
    return (
      <select value={String(rule.value ?? "")} onChange={(e) => onChange(e.target.value)}>
        {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return <input type="text" value={String(rule.value ?? "")} placeholder="enter text"
    onChange={(e) => onChange(e.target.value)} />;
}

// ========== RULE COMPONENT ==========
function RuleRow({ rule, onUpdate, onDelete }: {
  rule: RuleNode; onUpdate: (r: RuleNode) => void; onDelete: () => void;
}) {
  const q = rule.qkey ? QBY[rule.qkey] : undefined;
  const opsList = q ? (OPS[q.type] || OPS.text) : [];

  const bySec: Record<string, FlatQ[]> = {};
  QLIST.forEach((qq) => {
    if (!bySec[qq.sectionEn]) bySec[qq.sectionEn] = [];
    bySec[qq.sectionEn].push(qq);
  });

  return (
    <div className="rule-wrap">
      <span className="connector" />
      <div className="rule">
        <div className="qpicker">
          {q && <span className="qnum">{q.qn}</span>}
          <select value={rule.qkey} onChange={(e) => {
            const newQ = QBY[e.target.value];
            const newOp = defaultOp(newQ);
            onUpdate({ ...rule, qkey: e.target.value, op: newOp, value: defaultValue(newQ, newOp) });
          }}>
            <option value="">— Pick a question —</option>
            {Object.entries(bySec).map(([sec, qs]) => (
              <optgroup key={sec} label={sec}>
                {qs.map((qq) => (
                  <option key={qq.key} value={qq.key}>Q{qq.qn}. {labelOf(qq.key)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <select value={rule.op} disabled={!q} onChange={(e) => {
          const newOp = e.target.value;
          onUpdate({ ...rule, op: newOp, value: defaultValue(q, newOp) });
        }}>
          {!q && <option value="">—</option>}
          {opsList.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <div className="val">
          <ValueCell rule={rule} onChange={(v) => onUpdate({ ...rule, value: v })} />
        </div>

        <button className="delete" onClick={onDelete} title="Remove">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M6 6l1 14h10l1-14" /></svg>
        </button>
      </div>
    </div>
  );
}

// ========== GROUP COMPONENT ==========
function GroupComp({ group, depth, index, onUpdate, onDelete }: {
  group: GroupNode; depth: number; index: number;
  onUpdate: (g: GroupNode) => void; onDelete: (() => void) | null;
}) {
  const isRoot = depth === 0;
  const ruleCount = group.children.length;

  const updateChild = (i: number, node: Node) => {
    const next = [...group.children];
    next[i] = node;
    onUpdate({ ...group, children: next });
  };

  const removeChild = (i: number) => {
    onUpdate({ ...group, children: group.children.filter((_, idx) => idx !== i) });
  };

  return (
    <div className={`group ${depth > 0 ? "nested" : ""}`}>
      <header className="group-bar">
        <div className="group-name">
          <span>{isRoot ? "Root group" : "Sub-group"}</span>
          <span className="gnum">G{index + 1}</span>
        </div>
        <div className="conj">
          <button className={group.conj === "and" ? "on" : ""} onClick={() => onUpdate({ ...group, conj: "and" })}>AND</button>
          <button className={group.conj === "or" ? "on" : ""} onClick={() => onUpdate({ ...group, conj: "or" })}>OR</button>
        </div>
        <div className="spacer" />
        <span className="count"><b>{ruleCount}</b> rule{ruleCount === 1 ? "" : "s"}</span>
        {onDelete && (
          <button className="iconbtn danger" onClick={onDelete} title="Delete group">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14h10l1-14" /></svg>
          </button>
        )}
      </header>

      <div className="rules">
        {group.children.length === 0 ? (
          <div style={{ color: "var(--ink-4)", fontSize: "12.5px", padding: "4px 6px", fontStyle: "italic" }}>
            This group has no rules yet — add one below
          </div>
        ) : (
          group.children.map((child, i) =>
            child.type === "rule" ? (
              <RuleRow key={child.id} rule={child} onUpdate={(r) => updateChild(i, r)} onDelete={() => removeChild(i)} />
            ) : (
              <GroupComp key={child.id} group={child} depth={depth + 1} index={i}
                onUpdate={(g) => updateChild(i, g)} onDelete={() => removeChild(i)} />
            )
          )
        )}
      </div>

      <div className="group-foot">
        <button className="ghost-btn" onClick={() => onUpdate({ ...group, children: [...group.children, newRule()] })}>
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg> Add rule
        </button>
        <button className="ghost-btn" onClick={() => {
          const ng: GroupNode = { id: nextId(), type: "group", conj: "and", children: [newRule()] };
          onUpdate({ ...group, children: [...group.children, ng] });
        }}>
          <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 12h6M12 9v6" /></svg> Add sub-group
        </button>
        <div className="spacer" />
        <span className="foot-hint">
          Conditions inside this group are joined with{" "}
          <b style={{ color: "var(--m-2)", fontFamily: "'JetBrains Mono', monospace" }}>{group.conj.toUpperCase()}</b>
        </span>
      </div>
    </div>
  );
}

// ========== PREVIEW ==========
function describeNode(node: Node): string {
  if (node.type === "rule") {
    const q = QBY[node.qkey];
    if (!q) return '<span style="color:var(--ink-4)">[incomplete rule]</span>';
    const ops = OPS[q.type] || OPS.text;
    const opLabel = ops.find(([v]) => v === node.op)?.[1] || node.op;
    let vHtml = "";
    const v = node.value;
    if (node.op === "empty" || node.op === "not_empty") {
      vHtml = "";
    } else if (Array.isArray(v)) {
      if (node.op === "between" || node.op === "not_between") {
        vHtml = `<span class="vv">${v[0] || "?"}</span> – <span class="vv">${v[1] || "?"}</span>`;
      } else {
        vHtml = v.length ? v.map((x: string) => `<span class="vv">${x}</span>`).join(" ") : '<span class="vv">?</span>';
      }
    } else {
      vHtml = `<span class="vv">${v || "?"}</span>`;
    }
    return `<span class="qref">Q${q.qn}. ${labelOf(q.key)}</span> <span class="op">${opLabel}</span> ${vHtml}`;
  }

  if (!node.children.length) return '<span style="color:var(--ink-4)">[empty group]</span>';
  const parts = node.children.map((c) => describeNode(c));
  const joiner = `<span class="conj-word">${node.conj.toUpperCase()}</span>`;
  return `<span class="paren">(</span> ${parts.join(" " + joiner + " ")} <span class="paren">)</span>`;
}

// ========== MAIN PAGE ==========
export default function Home() {
  const [labelType, setLabelType] = useState<"selection" | "preference">("selection");
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [root, setRoot] = useState<GroupNode>({
    id: nextId(), type: "group", conj: "and",
    children: [newRule()],
  });

  const stats = countStats(root);
  const previewHtml = stats.rules === 0
    ? '<div class="empty">No conditions yet. Use the query builder above to add your first rule.</div>'
    : describeNode(root);

  const validationText = stats.rules === 0
    ? "No rules yet"
    : stats.invalid > 0
      ? `${stats.invalid} incomplete rule${stats.invalid === 1 ? "" : "s"}`
      : "All rules valid ✓";
  const validationColor = stats.rules === 0 ? "var(--ink-4)" : stats.invalid > 0 ? "var(--danger)" : "var(--accent-2)";

  useEffect(() => {
    document.body.className = labelType === "preference" ? "mode-preference" : "mode-selection";
  }, [labelType]);

  return (
    <>
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <div className="dot" />
          <div className="bname">EARN<span>·</span>EMS</div>
        </div>
        <nav className="crumbs">
          <span>Survey</span><span className="sep">/</span>
          <span>Labels</span><span className="sep">/</span>
          <span className="cur">New Label</span>
        </nav>
        <div className="spacer" />
        <button className="icon-btn" title="Help">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.7.5-1.5 1-1.5 2" /><path d="M12 17h.01" /></svg>
        </button>
        <div className="avatar">RA</div>
      </header>

      <main className="page">
        {/* Page Header */}
        <div className="page-head">
          <div>
            <div className="crumb-label">EARN·EMS · LABEL · NEW</div>
            <h1>Create a new <span style={{ color: "var(--m-2)" }}>{labelType === "preference" ? "Preference" : "Selection"}</span> Label</h1>
            <div className="lede">Build rules from any combination of {TOTAL_QUESTIONS} survey questions · use groups and AND/OR to compose conditions</div>
          </div>
          <div className="head-actions">
            <button className="btn ghost">Cancel</button>
            <button className="btn">Save as draft <span className="k">⌘S</span></button>
            <button className="btn primary" onClick={() => {
              const payload = { nameEn, nameBn, type: labelType, query: root };
              console.log("LABEL_SAVED", payload);
              alert("Label saved (see JSON in console)\n\n" + (nameEn || nameBn || "(no name set)"));
            }}>
              <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg> Save Label <span className="k">⌘↵</span>
            </button>
          </div>
        </div>

        {/* Step 1: Label Identity */}
        <section className="card">
          <header className="card-head">
            <div className="ico">
              <svg viewBox="0 0 24 24"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.5" /></svg>
            </div>
            <div className="titles">
              <h2>Label Identity</h2>
              <div className="sub">Set the English &amp; Bangla names and select the label type</div>
            </div>
            <span className="step">STEP 01</span>
          </header>
          <div className="card-body">
            <div className="field-grid">
              <div className="field">
                <label>Name (English) <span className="req">*</span> <span className="tag">nameEn</span></label>
                <input type="text" placeholder="e.g. NEET youth 18-25" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                <div className="hint">English characters · used in database and reports</div>
              </div>
              <div className="field">
                <label>Name (Bangla) <span className="req">*</span> <span className="tag">nameBn</span></label>
                <input type="text" className="bn" placeholder="e.g. NEET Yubok 18-25" value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
                <div className="hint">Bangla characters · shown on forms and dashboards</div>
              </div>
              <div className="field">
                <label>Label Type <span className="req">*</span> <span className="tag">type</span></label>
                <div className="type-cards">
                  <label className={`type-card ${labelType === "selection" ? "on" : ""}`} onClick={() => setLabelType("selection")}>
                    <input type="radio" name="ltype" value="selection" checked={labelType === "selection"} readOnly />
                    <span className="radio" />
                    <span className="tcopy">
                      <b>Selection</b>
                      <span className="desc">Hard eligibility filter — who qualifies</span>
                    </span>
                  </label>
                  <label className={`type-card ${labelType === "preference" ? "on" : ""}`} onClick={() => setLabelType("preference")}>
                    <input type="radio" name="ltype" value="preference" checked={labelType === "preference"} readOnly />
                    <span className="radio" />
                    <span className="tcopy">
                      <b>Preference</b>
                      <span className="desc">Priority / scoring — used for ranking</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Query Builder */}
        <section className="card">
          <header className="qb-head">
            <div className="ico">
              <svg viewBox="0 0 24 24"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
            </div>
            <div className="titles">
              <h2>Query Builder <span className="step" style={{ marginLeft: 6 }}>STEP 02</span></h2>
              <div className="sub">Apply conditions across {TOTAL_QUESTIONS} survey questions · combine with groups and AND/OR</div>
            </div>
            <span className="pip"><span className="dot" /> {stats.rules} rules · {stats.groups} groups</span>
            <div className="qb-actions">
              <button className="btn ghost" onClick={() => setRoot({ id: nextId(), type: "group", conj: "and", children: [newRule()] })}>
                <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14h10l1-14" /></svg> Reset
              </button>
            </div>
          </header>
          <div className="card-body" style={{ background: "#fafbfa" }}>
            <GroupComp group={root} depth={0} index={0} onUpdate={setRoot} onDelete={null} />
          </div>
        </section>

        {/* Preview */}
        <section className="preview-panel">
          <header className="preview-head">
            <span className="lbl">Preview · logical expression</span>
            <span className="badge">{labelType === "preference" ? "PREFERENCE" : "SELECTION"}</span>
            <div className="spacer" />
            <span className="lbl">Est. eligible: <b className="mono" style={{ color: "var(--ink)", fontSize: 13 }}>~1,240</b> people</span>
          </header>
          <div className="preview-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </section>

        {/* Sticky Footer */}
        <div className="sticky-foot">
          <span className="stats">Validation: <b style={{ color: validationColor }}>{validationText}</b></span>
          <span className="stats">·</span>
          <span className="stats">Questions used: <b>{stats.qused}</b>/{TOTAL_QUESTIONS}</span>
          <div className="spacer" />
          <button className="btn ghost">Cancel</button>
          <button className="btn">Save as draft</button>
          <button className="btn primary">
            <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg> Save Label
          </button>
        </div>
      </main>
    </>
  );
}
