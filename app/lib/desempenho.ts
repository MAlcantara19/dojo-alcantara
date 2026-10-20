import { collection, doc, getDocs, increment, query, setDoc, where } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Escopo } from "./alunos";

export type Desempenho = { id: string; uid: string; turma: string; termo: string; acertos: number; erros: number; ts: number };

const slug = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Guarda, para o professor acompanhar, se o aluno acertou ou errou cada palavra da roleta. */
export async function registrarPalavra(uid: string, turma: string, termo: string, acertou: boolean) {
  await setDoc(
    doc(getDb(), "desempenhoPalavras", `${uid}__${slug(termo)}`),
    { uid, turma, termo, acertos: increment(acertou ? 1 : 0), erros: increment(acertou ? 0 : 1), ts: Date.now() },
    { merge: true },
  );
}

const ler = (s: Awaited<ReturnType<typeof getDocs>>): Desempenho[] => s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Desempenho, "id">) }));

export async function lerMeuDesempenho(uid: string): Promise<Desempenho[]> {
  return ler(await getDocs(query(collection(getDb(), "desempenhoPalavras"), where("uid", "==", uid))));
}

/** null = administrador (tudo); lista = as turmas do professor. */
export async function lerDesempenhoEquipe(escopo: Escopo): Promise<Desempenho[]> {
  const col = collection(getDb(), "desempenhoPalavras");
  if (escopo === null) return ler(await getDocs(col));
  const partes = await Promise.all(escopo.filter(Boolean).map((t) => getDocs(query(col, where("turma", "==", t)))));
  return partes.flatMap(ler);
}
