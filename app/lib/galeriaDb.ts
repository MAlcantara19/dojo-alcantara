import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

export type FotoDoc = { id: string; legenda: string; url: string; ts?: number };

export async function lerGaleria(): Promise<FotoDoc[]> {
  const snap = await getDocs(collection(getDb(), "galeria"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FotoDoc, "id">) })).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
}
export async function addFoto(legenda: string, url: string) {
  await addDoc(collection(getDb(), "galeria"), { legenda, url, ts: Date.now(), criadoEm: serverTimestamp() });
}
export const salvarLegenda = (id: string, legenda: string) => updateDoc(doc(getDb(), "galeria", id), { legenda });
export const apagarFoto = (id: string) => deleteDoc(doc(getDb(), "galeria", id));
