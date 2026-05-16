import type { Section, Question } from "@/types/survey";

export interface FlatQuestion extends Question {
  sectionId: number;
  sectionNameEn: string;
  sectionNameBn: string;
  parentSectionNameEn?: string;
}

export function flattenSections(sections: Section[]): FlatQuestion[] {
  const result: FlatQuestion[] = [];

  for (const section of sections) {
    for (const q of section.questions) {
      result.push({
        ...q,
        sectionId: section.id,
        sectionNameEn: section.sectionNameEn,
        sectionNameBn: section.sectionNameBn,
      });
    }
    for (const sub of section.subSections) {
      for (const q of sub.questions) {
        result.push({
          ...q,
          sectionId: sub.id,
          sectionNameEn: sub.sectionNameEn,
          sectionNameBn: sub.sectionNameBn,
          parentSectionNameEn: section.sectionNameEn,
        });
      }
    }
  }

  return result;
}

export function getFieldOptions(questions: FlatQuestion[]) {
  return questions.map((q) => ({
    value: q.fieldKey,
    label: `${q.questionEn} (${q.fieldKey})`,
    sectionEn: q.parentSectionNameEn
      ? `${q.parentSectionNameEn} > ${q.sectionNameEn}`
      : q.sectionNameEn,
    question: q,
  }));
}
