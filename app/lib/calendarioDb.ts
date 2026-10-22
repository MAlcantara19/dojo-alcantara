import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Feriado } from "./feriados";

/* ---------- Feriados locais (da cidade) ---------- */
export type FeriadoLocal = Feriado & { id: string };
export async function lerFeriadosLocais(): Promise<FeriadoLocal[]> {
  const snap = await getDocs(collection(getDb(), "feriados"));
  return snap.docs.map((d) => ({ id: d.id, local: true, ...(d.data() as { data: string; nome: string }) })).sort((a, b) => a.data.localeCompare(b.data));
}
export async function addFeriadoLocal(data: string, nome: string) {
  await addDoc(collection(getDb(), "feriados"), { data, nome, criadoEm: serverTimestamp() });
}
export const salvarFeriadoLocal = (id: string, data: string, nome: string) => updateDoc(doc(getDb(), "feriados", id), { data, nome });
export const apagarFeriadoLocal = (id: string) => deleteDoc(doc(getDb(), "feriados", id));

/* ---------- Calendários oficiais (ex.: da Confederação), em imagem ou PDF ---------- */
export type CalendarioOficial = { id: string; titulo: string; tipo: "imagem" | "pdf"; url: string; ts: number };
export async function lerCalendariosOficiais(): Promise<CalendarioOficial[]> {
  const snap = await getDocs(collection(getDb(), "calendariosOficiais"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarioOficial, "id">) })).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
}
export async function addCalendarioOficial(titulo: string, tipo: "imagem" | "pdf", url: string) {
  await addDoc(collection(getDb(), "calendariosOficiais"), { titulo, tipo, url, ts: Date.now(), criadoEm: serverTimestamp() });
}
export const apagarCalendarioOficial = (id: string) => deleteDoc(doc(getDb(), "calendariosOficiais", id));
