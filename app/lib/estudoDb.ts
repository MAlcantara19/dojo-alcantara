import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getDb } from "./firebase";
import { exerciciosPadrao, type Exercicio } from "./exercicios";
import { ampliada, basica, type Palavra } from "./palavras";
import type { Pergunta } from "./simulados";
import { simuladosPadraoCompletos } from "./simuladosPadrao";

/* ---------------- Palavras da roleta ---------------- */
export const LISTA_DOJO = "Palavras do dojô";
export type PalavraDoc = Palavra & { id: string; listas: string[] };
export type ListaPalavras = { id: string; nome: string };
export type OpcaoLista = { nome: string; itens: Palavra[] };

export async function lerPalavras(): Promise<PalavraDoc[]> {
  const snap = await getDocs(collection(getDb(), "palavras"));
  return snap.docs.map((d) => {
    const r = d.data() as { termo?: string; significado?: string; listas?: unknown; lista?: string };
    // Palavras antigas tinham só "basica" ou "extra".
    const listas = Array.isArray(r.listas) ? r.listas.filter((x): x is string => typeof x === "string") : r.lista === "basica" ? [LISTA_DOJO] : [];
    return { id: d.id, termo: String(r.termo ?? ""), significado: String(r.significado ?? ""), listas };
  });
}

export async function addPalavra(p: { termo: string; significado: string; listas: string[] }) {
  await addDoc(collection(getDb(), "palavras"), { ...p, criadoEm: serverTimestamp() });
}
export async function atualizarPalavra(id: string, p: { termo: string; significado: string; listas: string[] }) {
  await updateDoc(doc(getDb(), "palavras", id), { ...p });
}
export const apagarPalavra = (id: string) => deleteDoc(doc(getDb(), "palavras", id));

export async function lerListasPalavras(): Promise<ListaPalavras[]> {
  const snap = await getDocs(collection(getDb(), "listasPalavras"));
  return snap.docs.map((d) => ({ id: d.id, nome: String((d.data() as { nome?: string }).nome ?? "") })).filter((l) => l.nome).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export async function addListaPalavras(nome: string) {
  await addDoc(collection(getDb(), "listasPalavras"), { nome, criadoEm: serverTimestamp() });
}
export const apagarListaPalavras = (id: string) => deleteDoc(doc(getDb(), "listasPalavras", id));

export async function importarPalavrasPadrao() {
  const db = getDb();
  const batch = writeBatch(db);
  const nomesBasica = new Set(basica.map((p) => p.termo));
  const vistos = new Set<string>();
  ampliada.forEach((p) => {
    if (vistos.has(p.termo)) return;
    vistos.add(p.termo);
    batch.set(doc(collection(db, "palavras")), { termo: p.termo, significado: p.significado, listas: nomesBasica.has(p.termo) ? [LISTA_DOJO] : [], criadoEm: serverTimestamp() });
  });
  batch.set(doc(collection(db, "listasPalavras")), { nome: LISTA_DOJO, criadoEm: serverTimestamp() });
  await batch.commit();
}

/** As listas que aparecem na roleta: "Todas" + cada lista criada (com 2 palavras ou mais). */
export function opcoesDePalavras(docs: PalavraDoc[], listas: ListaPalavras[]): OpcaoLista[] {
  if (docs.length === 0) return [{ nome: "Palavras do dojô (padrão)", itens: basica }, { nome: "Lista ampliada (todas)", itens: ampliada }];
  const ordenar = (a: PalavraDoc, b: PalavraDoc) => a.termo.localeCompare(b.termo, "pt-BR");
  const limpar = (l: PalavraDoc[]): Palavra[] => [...l].sort(ordenar).map(({ termo, significado }) => ({ termo, significado }));
  const nomes = Array.from(new Set([...listas.map((l) => l.nome), ...docs.flatMap((d) => d.listas)]));
  nomes.sort((a, b) => (a === LISTA_DOJO ? -1 : b === LISTA_DOJO ? 1 : a.localeCompare(b, "pt-BR")));
  const opcoes: OpcaoLista[] = [{ nome: "Todas as palavras", itens: limpar(docs) }];
  nomes.forEach((n) => {
    const itens = docs.filter((d) => d.listas.includes(n));
    if (itens.length >= 2) opcoes.push({ nome: n, itens: limpar(itens) });
  });
  return opcoes;
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
export const atualizarSimulado = (id: string, titulo: string, descricao: string) => updateDoc(doc(getDb(), "simulados", id), { titulo, descricao });
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
export const atualizarExercicio = (id: string, e: Exercicio) => updateDoc(doc(getDb(), "exercicios", id), { ...e });
export async function importarExerciciosPadrao() {
  const db = getDb();
  const batch = writeBatch(db);
  exerciciosPadrao.forEach((e) => batch.set(doc(collection(db, "exercicios")), { ...e, criadoEm: serverTimestamp() }));
  await batch.commit();
}
export const exerciciosOuPadrao = (docs: ExercicioDoc[]): Exercicio[] => (docs.length ? docs : exerciciosPadrao);
