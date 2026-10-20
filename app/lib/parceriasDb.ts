import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

export type Parceria = { id: string; nome: string; descricao: string; url: string; logo: string; ts: number };
export type DadosParceria = Omit<Parceria, "id" | "ts">;

export async function lerParcerias(): Promise<Parceria[]> {
  const snap = await getDocs(collection(getDb(), "parcerias"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Parceria, "id">) })).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
}
export async function addParceria(d: DadosParceria) {
  await addDoc(collection(getDb(), "parcerias"), { ...d, ts: Date.now(), criadoEm: serverTimestamp() });
}
export const atualizarParceria = (id: string, d: DadosParceria) => updateDoc(doc(getDb(), "parcerias", id), { ...d });
export const apagarParceria = (id: string) => deleteDoc(doc(getDb(), "parcerias", id));
