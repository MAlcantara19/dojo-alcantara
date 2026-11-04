import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getDb } from "./firebase";

/* Chamada: uma por turma e por dia. Marcado = veio; não marcado = faltou. */
export type Chamada = { id: string; turma: string; data: string; presentes: string[]; total: number; autor: string; ts: number; obs?: string; visitantes?: string[]; nomes?: Record<string, string> };

export const idChamada = (turma: string, data: string) => `${turma.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-")}_${data}`;

export async function lerChamada(turma: string, data: string): Promise<Chamada | null> {
  const d = await getDoc(doc(getDb(), "chamadas", idChamada(turma, data)));
  return d.exists() ? ({ id: d.id, ...(d.data() as Omit<Chamada, "id">) }) : null;
}
export async function salvarChamada(c: Omit<Chamada, "id">) {
  await setDoc(doc(getDb(), "chamadas", idChamada(c.turma, c.data)), c);
}
export async function chamadasDaTurma(turma: string): Promise<Chamada[]> {
  const snap = await getDocs(query(collection(getDb(), "chamadas"), where("turma", "==", turma)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Chamada, "id">) })).sort((a, b) => b.data.localeCompare(a.data));
}
/** Presenças de um aluno (o próprio aluno pode ver as dele). */
export async function minhasPresencas(uid: string): Promise<Chamada[]> {
  const snap = await getDocs(query(collection(getDb(), "chamadas"), where("presentes", "array-contains", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Chamada, "id">) })).sort((a, b) => b.data.localeCompare(a.data));
}

/** Todas as chamadas (para a equipe calcular os graus de todo mundo). */
export async function todasChamadas(): Promise<Chamada[]> {
  const snap = await getDocs(collection(getDb(), "chamadas"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Chamada, "id">) }));
}
