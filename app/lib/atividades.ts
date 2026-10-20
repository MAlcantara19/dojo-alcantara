import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getDb } from "./firebase";

/* Registro do que os alunos mudam no site (só o administrador vê). */
export type Atividade = { id: string; uid: string; nome: string; texto: string; ts: number };

export async function registrarAtividade(uid: string, nome: string, texto: string) {
  await addDoc(collection(getDb(), "atividades"), { uid, nome: nome.slice(0, 100), texto: texto.slice(0, 300), ts: Date.now() }).catch(() => undefined);
}
export async function lerAtividades(): Promise<Atividade[]> {
  const snap = await getDocs(query(collection(getDb(), "atividades"), orderBy("ts", "desc"), limit(60)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Atividade, "id">) }));
}
export const apagarAtividade = (id: string) => deleteDoc(doc(getDb(), "atividades", id));
