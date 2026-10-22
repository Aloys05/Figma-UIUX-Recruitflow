// Candidate prototype state. Browser-only storage; no network or account backend.
import { useEffect, useState } from "react";

export type CandidateProfile = {
  firstName: string; lastName: string; email: string; phone: string;
  location: string; city: string; region: string; headline: string; summary: string;
  skills: string; jobTitle: string; employer: string; experienceDescription: string;
  qualification: string; institution: string; graduationYear: string;
  desiredRole: string; workMode: string; availability: string;
  employmentTypes: string; yearsExperience: string; noticePeriod: string; relocating: string;
  languages: string; linkedin: string; portfolio: string; github: string;
  cvFileName: string; photoFileName: string;
};

export const emptyProfile: CandidateProfile = {
  firstName: "", lastName: "", email: "", phone: "", location: "", city: "", region: "", headline: "", summary: "",
  skills: "", jobTitle: "", employer: "", experienceDescription: "",
  qualification: "", institution: "", graduationYear: "",
  desiredRole: "", workMode: "", availability: "", employmentTypes: "", yearsExperience: "", noticePeriod: "", relocating: "",
  languages: "", linkedin: "", portfolio: "", github: "", cvFileName: "", photoFileName: "",
};

const profileKey = "recruitflow.demoCandidateProfile.v1";
const savedJobsKey = "recruitflow.demoSavedJobs.v1";
export const profileUpdated = "recruitflow:profile-updated";
export const savedJobsUpdated = "recruitflow:saved-jobs-updated";

export function loadCandidateProfile(): CandidateProfile {
  try {
    const data = localStorage.getItem(profileKey);
    if (!data) return { ...emptyProfile };
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...emptyProfile };
    const result = { ...emptyProfile };
    for (const key of Object.keys(result) as (keyof CandidateProfile)[]) {
      if (typeof parsed[key] === "string") result[key] = parsed[key];
    }
    // Preserve city from older browser profiles that only had a Location field.
    if (!result.city && result.location) result.city = result.location;
    return result;
  } catch { return { ...emptyProfile }; }
}

export function storeCandidateProfile(profile: CandidateProfile) {
  localStorage.setItem(profileKey, JSON.stringify(profile));
  window.dispatchEvent(new Event(profileUpdated));
}

const hasText = (s: string) => Boolean(s.trim());
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
export const splitTags = (s: string) => s.split(",").map(value => value.trim()).filter(Boolean);
export const profileSections = ["Personal details", "CV & documents", "Skills", "Work experience", "Education", "Preferences", "Links"] as const;

// Ten transparent core requirements from the reference readiness form.
// Optional experience, education, employment preferences, languages and links
// are editable but don't incorrectly prevent a complete profile reaching 100%.
export function readinessRequirements(p: CandidateProfile) {
  const skills = [...new Set(splitTags(p.skills).map(skill => skill.toLowerCase()))];
  return [
    { label: "Full name", section: "Personal details", done: hasText(`${p.firstName} ${p.lastName}`) },
    { label: "Email address", section: "Personal details", done: isEmail(p.email) },
    { label: "Profile photo", section: "Personal details", done: hasText(p.photoFileName) },
    { label: "Professional headline", section: "Personal details", done: hasText(p.headline) },
    { label: "About you", section: "Personal details", done: hasText(p.summary) },
    { label: "City / town", section: "Personal details", done: hasText(p.city || p.location) },
    { label: "Region", section: "Personal details", done: hasText(p.region) },
    { label: "Current CV", section: "CV & documents", done: hasText(p.cvFileName) },
    { label: "At least one skill", section: "Skills", done: skills.length >= 1 },
    { label: "At least three skills", section: "Skills", done: skills.length >= 3 },
  ] as const;
}
export function profileChecks(p: CandidateProfile): Record<(typeof profileSections)[number], boolean[]> {
  const requirements = readinessRequirements(p);
  return Object.fromEntries(profileSections.map(section => [section, requirements.filter(item => item.section === section).map(item => item.done)])) as Record<(typeof profileSections)[number], boolean[]>;
}
export function calculateReadiness(profile: CandidateProfile) {
  const checks = readinessRequirements(profile);
  return Math.round(100 * checks.filter(item => item.done).length / checks.length);
}
export const getProfileReadiness = () => calculateReadiness(loadCandidateProfile());
export function useProfileReadiness() {
  const [percent, setPercent] = useState(getProfileReadiness);
  useEffect(() => {
    const update = () => setPercent(getProfileReadiness());
    const storage = (e: StorageEvent) => { if (e.key === profileKey || e.key === null) update(); };
    window.addEventListener(profileUpdated, update);
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener(profileUpdated, update); window.removeEventListener("storage", storage); };
  }, []);
  return percent;
}

export function readSavedJobs(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(savedJobsKey) || "[]");
    return Array.isArray(value) ? value.filter((id: unknown): id is string => typeof id === "string") : [];
  } catch { return []; }
}
export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState(readSavedJobs);
  useEffect(() => {
    const update = () => setSavedJobs(readSavedJobs());
    const storage = (e: StorageEvent) => { if (e.key === savedJobsKey || e.key === null) update(); };
    window.addEventListener(savedJobsUpdated, update);
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener(savedJobsUpdated, update); window.removeEventListener("storage", storage); };
  }, []);
  const toggle = (id: string): boolean => {
    const current = readSavedJobs();
    const nextSaved = !current.includes(id);
    const next = nextSaved ? [...current, id] : current.filter(job => job !== id);
    localStorage.setItem(savedJobsKey, JSON.stringify(next));
    setSavedJobs(next);
    window.dispatchEvent(new Event(savedJobsUpdated));
    return nextSaved;
  };
  return { savedJobs, toggle };
}

// Keep binaries in IndexedDB, not localStorage (which is too small for normal CVs).
const dbName = "recruitflow-demo-files";
const storeName = "uploads";
function openFileDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("File storage is unavailable in this browser."));
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(storeName)) req.result.createObjectStore(storeName); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Could not open file storage."));
  });
}
export async function saveBrowserFile(key: string, file: File): Promise<void> {
  const db = await openFileDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(file, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("File could not be saved."));
      transaction.onabort = () => reject(transaction.error || new Error("File save cancelled."));
    });
  } finally { db.close(); }
}
export async function loadBrowserFile(key: string): Promise<File | null> {
  const db = await openFileDb();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const req = transaction.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result instanceof Blob ? new File([req.result], req.result.name || "document", { type: req.result.type }) : null);
      req.onerror = () => reject(req.error || new Error("File could not be loaded."));
    });
  } finally { db.close(); }
}
export function isSupportedCV(file: File) { return /\.(pdf|doc|docx)$/i.test(file.name) && file.size <= 10 * 1024 * 1024; }
export function isSupportedPhoto(file: File) { return /\.(png|jpe?g|webp)$/i.test(file.name) && file.size <= 10 * 1024 * 1024; }
