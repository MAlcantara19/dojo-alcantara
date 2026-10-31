import { addDoc, collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { getDb } from "./firebase";

/* Exames de faixa: data, turmas e local (função em preparação, liga em Site > Aparência). */
export type Exame = { id: string; data: string; turmas: string[]; local: string; obs: string; ts: number };
export async function lerExames(): Promise<Exame[]> {
  const snap = await getDocs(collection(getDb(), "exames"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exame, "id">) })).sort((a, b) => a.data.localeCompare(b.data));
}
export async function addExame(e: Omit<Exame, "id" | "ts">) {
  await addDoc(collection(getDb(), "exames"), { ...e, ts: Date.now() });
}
export const apagarExame = (id: string) => deleteDoc(doc(getDb(), "exames", id));
