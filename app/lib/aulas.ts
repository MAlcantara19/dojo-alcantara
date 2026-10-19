import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { getDb } from "./firebase";

export const focos = ["Técnica", "Condicionamento", "Circuito", "Randori", "Kata", "Preparação para prova", "Outro"];
export type Aula = { id: string; dono: string; data: string; titulo: string; foco: string; detalhes: string };

export async function lerAulas(uid: string): Promise<Aula[]> {
  const snap = await getDocs(query(collection(getDb(), "aulas"), where("dono", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Aula, "id">) })).sort((a, b) => a.data.localeCompare(b.data));
}
export async function addAula(uid: string, a: { data: string; titulo: string; foco: string; detalhes: string }) {
  await addDoc(collection(getDb(), "aulas"), { dono: uid, ...a, criadoEm: serverTimestamp() });
}
export const apagarAula = (id: string) => deleteDoc(doc(getDb(), "aulas", id));
