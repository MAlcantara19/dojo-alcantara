import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import type { Escopo } from "./alunos";
import { getDb } from "./firebase";

/* Registro do que os alunos mudam no site (só o administrador vê). */
export type Atividade = { id: string; uid: string; nome: string; texto: string; ts: number; turma?: string };

/** turma = turma do aluno envolvido: o professor dessa turma também é avisado; o administrador vê tudo. */
export async function registrarAtividade(uid: string, nome: string, texto: string, turma = "") {
  await addDoc(collection(getDb(), "atividades"), { uid, nome: nome.slice(0, 100), texto: texto.slice(0, 300), ts: Date.now(), turma: turma.slice(0, 60) }).catch(() => undefined);
}
/** null = administrador (tudo); lista = as turmas do professor. */
export async function lerAtividades(escopo: Escopo = null): Promise<Atividade[]> {
  const col = collection(getDb(), "atividades");
  if (escopo === null) {
    const snap = await getDocs(query(col, orderBy("ts", "desc"), limit(60)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Atividade, "id">) }));
  }
  const partes = await Promise.all(escopo.filter(Boolean).map((t) => getDocs(query(col, where("turma", "==", t)))));
  return partes
    .flatMap((s) => s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Atividade, "id">) })))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 60);
}
export const apagarAtividade = (id: string) => deleteDoc(doc(getDb(), "atividades", id));
