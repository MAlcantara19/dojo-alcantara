import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

/* Campeonatos de cada aluno: o professor registra; o aluno vê na área dele. */

export const PONTOS = ["Ippon", "Waza-ari", "Yuko", "Shido"] as const;
export type Ponto = (typeof PONTOS)[number];
export const COMO = ["Ippon", "Waza-ari", "Yuko", "Decisão (hantei / golden score)", "Shido do adversário", "Hansoku-make", "Desistência / W.O.", "Lesão"] as const;
export const COLOCACOES = ["", "1º lugar", "2º lugar", "3º lugar", "5º lugar", "Participação"] as const;

export type Luta = {
  adversario: string;
  academia: string;
  resultado: "vitoria" | "derrota";
  como: string;
  aFavor: Record<Ponto, number>;
  contra: Record<Ponto, number>;
  tecnica: string;
  obs: string;
};
export type Campeonato = {
  id: string;
  nome: string;
  data: string;
  local: string;
  categoria: string;
  peso: string;
  colocacao: string;
  chave: string[];
  chaveImagem: string;
  lutas: Luta[];
  midias: string[];
  ts: number;
};
export type DadosCampeonato = Omit<Campeonato, "id" | "ts">;

export const lutaVazia = (): Luta => ({
  adversario: "",
  academia: "",
  resultado: "vitoria",
  como: "Ippon",
  aFavor: { Ippon: 0, "Waza-ari": 0, Yuko: 0, Shido: 0 },
  contra: { Ippon: 0, "Waza-ari": 0, Yuko: 0, Shido: 0 },
  tecnica: "",
  obs: "",
});

const limpar = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export async function lerCampeonatos(uid: string): Promise<Campeonato[]> {
  const snap = await getDocs(collection(getDb(), "users", uid, "campeonatos"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campeonato, "id">) })).sort((a, b) => b.data.localeCompare(a.data));
}
export async function addCampeonato(uid: string, c: DadosCampeonato) {
  await addDoc(collection(getDb(), "users", uid, "campeonatos"), { ...limpar(c), ts: Date.now(), criadoEm: serverTimestamp() });
}
export const salvarCampeonato = (uid: string, id: string, c: DadosCampeonato) => updateDoc(doc(getDb(), "users", uid, "campeonatos", id), { ...limpar(c) });
export const apagarCampeonato = (uid: string, id: string) => deleteDoc(doc(getDb(), "users", uid, "campeonatos", id));

/* ---------- Galeria pessoal do aluno (o aluno e o professor colocam fotos e vídeos) ---------- */
export type ItemGaleria = { id: string; url: string; legenda: string; autor: string; ts: number };
export async function lerGaleriaAluno(uid: string): Promise<ItemGaleria[]> {
  const snap = await getDocs(collection(getDb(), "users", uid, "galeria"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ItemGaleria, "id">) })).sort((a, b) => b.ts - a.ts);
}
export async function addGaleriaAluno(uid: string, item: { url: string; legenda: string; autor: string }) {
  await addDoc(collection(getDb(), "users", uid, "galeria"), { ...item, ts: Date.now() });
}
export const apagarGaleriaAluno = (uid: string, id: string) => deleteDoc(doc(getDb(), "users", uid, "galeria", id));
