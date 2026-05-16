export interface VisibleWhenCondition {
  fieldKey: string;
  operator: "Equals" | "NotEquals" | "In" | "NotIn" | "Contains" | "OR";
  value: string | number | (string | number)[];
  dependsOn: "value" | "age" | "labelEn" | "labelBn";
  conditions?: VisibleWhenCondition[];
}

export interface QuestionOption {
  value: string;
  labelEn: string;
  labelBn: string;
  status: number;
  score: number;
  colorHex: string | null;
  displayOrder: number;
  visibleWhen: VisibleWhenCondition | VisibleWhenCondition[] | null;
}

export interface Question {
  id: number;
  fieldKey: string;
  questionEn: string;
  questionBn: string;
  placeholderEn: string | null;
  placeholderBn: string | null;
  hintEn: string | null;
  hintBn: string | null;
  isRequired: boolean;
  isHidden: boolean;
  isReadOnly: boolean;
  questionNumber: number;
  displayOrder: number;
  dataType: number;
  uiElementType: number;
  storageTarget: number;
  propertyName: number | null;
  meta: Record<string, unknown> | null;
  visibleWhen: VisibleWhenCondition | VisibleWhenCondition[] | null;
  validationRules: unknown;
  sourceType: number;
  options: QuestionOption[] | null;
}

export interface Section {
  id: number;
  sectionShortNameEn: string;
  sectionShortNameBn: string;
  sectionNameBn: string;
  sectionNameEn: string;
  displayOrder: number;
  parentSectionId: number | null;
  visibleWhen: VisibleWhenCondition | VisibleWhenCondition[] | null;
  validationRules: unknown;
  subSections: Section[];
  questions: Question[];
}

export interface SurveySchema {
  id: number;
  formType: number;
  hash: string;
  status: number;
  consentYesSections: Section[];
  consentNoSections: Section[];
}
