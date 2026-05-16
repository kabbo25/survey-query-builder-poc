export interface SavedLabel {
  id: string;
  nameEn: string;
  nameBn: string;
  type: "selection" | "preference";
  status: "active" | "inactive" | "draft";
  query: unknown;
  createdAt: string;
  summary: {
    ageRange: string;
    education: string;
    experience: string;
    banglaEnglish: string;
    computerSkill: string;
    minorityGroup: string;
    gender: string;
  };
}

const STORAGE_KEY = "earn_labels";

export function getLabels(): SavedLabel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLabel(label: SavedLabel) {
  const labels = getLabels();
  labels.push(label);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
}

export function updateLabelStatus(id: string, status: SavedLabel["status"]) {
  const labels = getLabels();
  const idx = labels.findIndex((l) => l.id === id);
  if (idx >= 0) {
    labels[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  }
}

export function deleteLabel(id: string) {
  const labels = getLabels().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
}
