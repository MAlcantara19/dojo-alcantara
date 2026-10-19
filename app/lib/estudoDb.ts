import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getDb } from "./firebase";
import { exerciciosPadrao, type Exercicio } from "./exercicios";
import { ampliada, basica, type Palavra } from "./palavras";
import type { Pergunta } from "./simulados";
import { simuladosPadraoCompletos } from "./simuladosPadrao";

/* ---------------- Palavras da roleta ---------------- */
export type PalavraDoc = Palavra & { id: string; lista: "basica" | "extra" };

export async function lerPalavras(): Promise<PalavraDoc[]> {
  const snap = await getDocs(collection(getDb(), "palavras"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PalavraDoc, "id">) }));
}

export async function addPalavra(p: { termo: string; significado: string; lista: "basica" | "extra" }) {
  await addDoc(collection(getDb(), "palavras"), { ...p, criadoEm: serverTimestamp() });
}
export const apagarPalavra = (id: string) => deleteDoc(doc(getDb(), "palavras", id));

export async function importarPalavrasPadrao() {
  const db = getDb();
  const batch = writeBatch(db);
  const nomesBasica = new Set(basica.map((p) => p.termo));
  const vistos = new Set<string>();
  const linhas: { termo: string; significado: string; lista: "basica" | "extra" }[] = [];
  for (const p of ampliada) {
    if (vistos.has(p.termo)) continue;
    vistos.add(p.termo);
    linhas.push({ ...p, lista: nomesBasica.has(p.termo) ? "basica" : "extra" });
  }
  linhas.forEach((l) => batch.set(doc(collection(db, "palavras")), { ...l, criadoEm: serverTimestamp() }));
  await batch.commit();
}

/** Monta as duas listas da roleta a partir do que está no banco (ampliada = básica + extras). */
export function listasDePalavras(docs: PalavraDoc[]): { basica: Palavra[]; ampliada: Palavra[] } {
  if (docs.length === 0) return { basica, ampliada };
  const ord = [...docs].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
  const b = ord.filter((d) => d.lista === "basica").map(({ termo, significado }) => ({ termo, significado }));
  const todas = ord.map(({ termo, significado }) => ({ termo, significado }));
  return { basica: b.length >= 2 ? b : todas, ampliada: todas };
}

/* ---------------- Simulados ---------------- */
export type SimuladoDoc = { id: string; titulo: string; descricao: string; perguntas: Pergunta[] };

export async function lerSimulados(): Promise<SimuladoDoc[]> {
  const snap = await getDocs(collection(getDb(), "simulados"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SimuladoDoc, "id">) }))
    .map((s) => ({ ...s, perguntas: Array.isArray(s.perguntas) ? s.perguntas : [] }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}

export async function criarSimulado(titulo: string, descricao: string) {
  await addDoc(collection(getDb(), "simulados"), { titulo, descricao, perguntas: [], criadoEm: serverTimestamp() });
}
export const apagarSimulado = (id: string) => deleteDoc(doc(getDb(), "simulados", id));
export const salvarPerguntas = (id: string, perguntas: Pergunta[]) => updateDoc(doc(getDb(), "simulados", id), { perguntas });

export async function importarSimuladoPadrao() {
  const db = getDb();
  for (const s of simuladosPadraoCompletos()) {
    await setDoc(doc(db, "simulados", s.id), { titulo: s.titulo, descricao: s.descricao, perguntas: s.perguntas, criadoEm: serverTimestamp() });
  }
}

export function simuladosOuPadrao(docs: SimuladoDoc[]): SimuladoDoc[] {
  const validos = docs.filter((s) => s.perguntas.length > 0);
  return validos.length ? validos : simuladosPadraoCompletos();
}

/* ---------------- Exercícios da roleta ---------------- */
export type ExercicioDoc = Exercicio & { id: string };

export async function lerExercicios(): Promise<ExercicioDoc[]> {
  const snap = await getDocs(collection(getDb(), "exercicios"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExercicioDoc, "id">) })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export async function addExercicio(e: Exercicio) {
  await addDoc(collection(getDb(), "exercicios"), { ...e, criadoEm: serverTimestamp() });
}
export const apagarExercicio = (id: string) => deleteDoc(doc(getDb(), "exercicios", id));
export async function importarExerciciosPadrao() {
  const db = getDb();
  const batch = writeBatch(db);
  exerciciosPadrao.forEach((e) => batch.set(doc(collection(db, "exercicios")), { ...e, criadoEm: serverTimestamp() }));
  await batch.commit();
}
export const exerciciosOuPadrao = (docs: ExercicioDoc[]): Exercicio[] => (docs.length ? docs : exerciciosPadrao);
