import surveyData from "@/data/survey-schema.json";
import type { SurveySchema, Section, Question } from "@/types/survey";

const schema = surveyData as unknown as SurveySchema;
const allSections = schema.consentYesSections;

export interface FlatQ {
  key: string;
  qn: string;
  questionEn: string;
  sectionEn: string;
  sectionId: number;
  type: "num" | "date" | "yn" | "select" | "multi" | "text" | "mono";
  options: string[];
}

function inferType(q: Question): FlatQ["type"] {
  if (q.uiElementType === 5) return "yn";
  if (q.uiElementType === 7) return "multi";
  if (q.uiElementType === 6) return "select";
  if (q.uiElementType === 8) return "date";
  if (q.options && q.options.length > 0) {
    if (q.uiElementType === 4 || q.uiElementType === 7) return "multi";
    return "select";
  }
  if (q.dataType === 2 || q.dataType === 3 || q.dataType === 18) return "num";
  if (q.dataType === 16) return "date";
  if (q.dataType === 15) return "mono";
  if (q.dataType === 1) return "text";
  if (q.dataType === 7 || q.dataType === 8) return "select";
  return "text";
}

function flattenSection(section: Section, parentLabel?: string): FlatQ[] {
  const secLabel = parentLabel
    ? `${parentLabel} › ${section.sectionNameEn}`
    : section.sectionNameEn;

  const result: FlatQ[] = section.questions.map((q) => ({
    key: q.fieldKey,
    qn: String(q.questionNumber),
    questionEn: q.questionEn,
    sectionEn: secLabel,
    sectionId: section.id,
    type: inferType(q),
    options: q.options?.map((o) => o.labelEn) ?? [],
  }));

  for (const sub of section.subSections) {
    result.push(...flattenSection(sub, section.sectionNameEn));
  }

  return result;
}

export const QLIST: FlatQ[] = [];
for (const sec of allSections) {
  QLIST.push(...flattenSection(sec));
}

export const QBY = Object.fromEntries(QLIST.map((q) => [q.key, q]));

export const SECTION_LABELS: Record<string, string> = {};
for (const q of QLIST) {
  SECTION_LABELS[q.sectionEn] = q.sectionEn;
}

export const TOTAL_QUESTIONS = QLIST.length;
