import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import type { Chamada } from "./chamadas";
import { getDb } from "./firebase";

/* Destaques do mês: ranking de presença (com empates) e competições internas registradas pela equipe. */
export const MEDALHAS = ["🥇", "🥈", "🥉", "🥉"]; // no judô o 3º lugar é dividido: bronze também para o 4º
export type Posicao = { lugar: number; medalha: string; treinos: number; uids: string[] };

/** Agrupa por número de treinos no mês; quem empata fica na mesma posição. Até o 4º lugar. */
export function rankingPresenca(chamadas: Chamada[], mes: string): Posicao[] {
  const conta = new Map<string, number>();
  chamadas.filter((c) => c.data.startsWith(mes)).forEach((c) => c.presentes.forEach((u) => conta.set(u, (conta.get(u) ?? 0) + 1)));
  const valores = Array.from(new Set(conta.values())).sort((a, b) => b - a).slice(0, 4);
  return valores.map((n, k) => ({ lugar: k + 1, medalha: MEDALHAS[k], treinos: n, uids: Array.from(conta.entries()).filter(([, v]) => v === n).map(([u]) => u) }));
}
/** Nome de cada aluno guardado nas chamadas (assim a turma vê sem acessar o cadastro dos colegas). */
export function nomesDasChamadas(chamadas: Chamada[]): Record<string, string> {
  return chamadas.reduce<Record<string, string>>((m, c) => ({ ...m, ...(c.nomes ?? {}) }), {});
}

export type Destaque = { id: string; turma: string; mes: string; titulo: string; aluno: string; posicao: number; resultado: string; obs: string; ts: number };
export async function lerDestaques(mes: string): Promise<Destaque[]> {
  const snap = await getDocs(query(collection(getDb(), "destaques"), where("mes", "==", mes)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Destaque, "id">) })).sort((a, b) => a.titulo.localeCompare(b.titulo) || a.posicao - b.posicao);
}
export async function addDestaque(d: Omit<Destaque, "id" | "ts">) {
  await addDoc(collection(getDb(), "destaques"), { ...d, ts: Date.now() });
}
export const apagarDestaque = (id: string) => deleteDoc(doc(getDb(), "destaques", id));
