import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import type { Aluno } from "./aluno";
import { hojeISO } from "./aluno";
import { paraEmail, type Papel } from "./auth";
import { criarContaSecundaria, getDb } from "./firebase";

/** null = admin (vê tudo); lista = turmas que o professor pode ver. */
export type Escopo = string[] | null;

export type NovaConta = {
  nome: string;
  apelido: string;
  apelidoInterno: string;
  dataNascimento: string;
  faixa: string;
  academia: string;
  email: string;
  celular: string;
  papel: Papel;
  turmas: string[];
};

export async function criarConta(d: NovaConta, senha: string): Promise<{ login: string }> {
  const login = paraEmail(d.email || d.celular);
  if (!login) throw new Error("sem-contato");
  const uid = await criarContaSecundaria(login, senha);
  const db = getDb();
  await setDoc(doc(db, "users", uid), {
    nome: d.nome,
    apelido: d.apelido,
    dataNascimento: d.dataNascimento || "",
    faixa: d.faixa,
    faixaDesde: hojeISO(),
    academia: d.academia,
    papel: d.papel,
    email: d.email.trim().toLowerCase(),
    celular: d.celular.replace(/\D/g, ""),
    login,
    ...(d.papel === "professor" ? { turmas: d.turmas } : {}),
    precisaTrocarSenha: true,
    criadoEm: serverTimestamp(),
  });
  if (d.apelidoInterno.trim()) await setDoc(doc(db, "usersInterno", uid), { apelidoInterno: d.apelidoInterno.trim() });
  return { login };
}

export async function listarAlunos(escopo: Escopo): Promise<Aluno[]> {
  const col = collection(getDb(), "users");
  const snaps =
    escopo === null
      ? [await getDocs(query(col, where("papel", "==", "aluno")))]
      : await Promise.all(escopo.map((t) => getDocs(query(col, where("papel", "==", "aluno"), where("academia", "==", t)))));
  const m = new Map<string, Aluno>();
  snaps.forEach((s) => s.docs.forEach((d) => m.set(d.id, { uid: d.id, ...(d.data() as Omit<Aluno, "uid">) })));
  return Array.from(m.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function listarProfessores(): Promise<Aluno[]> {
  const snap = await getDocs(query(collection(getDb(), "users"), where("papel", "==", "professor")));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Aluno, "uid">) })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export async function salvarTurmasProfessor(uid: string, turmas: string[]) {
  await updateDoc(doc(getDb(), "users", uid), { turmas });
}

/* ---------- Turmas (nomes) ---------- */
export type Turma = { id: string; nome: string };
export async function lerTurmas(): Promise<Turma[]> {
  const snap = await getDocs(collection(getDb(), "turmas"));
  return snap.docs.map((d) => ({ id: d.id, nome: String((d.data() as { nome?: string }).nome ?? "") })).filter((t) => t.nome).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export async function addTurma(nome: string) {
  await addDoc(collection(getDb(), "turmas"), { nome, criadoEm: serverTimestamp() });
}
export const apagarTurma = (id: string) => deleteDoc(doc(getDb(), "turmas", id));

export async function lerInternos(): Promise<Record<string, string>> {
  const snap = await getDocs(collection(getDb(), "usersInterno"));
  const m: Record<string, string> = {};
  snap.docs.forEach((d) => {
    m[d.id] = String((d.data() as { apelidoInterno?: string }).apelidoInterno ?? "");
  });
  return m;
}

export async function mudarFaixa(uid: string, faixa: string) {
  await updateDoc(doc(getDb(), "users", uid), { faixa, faixaDesde: hojeISO() });
}

export async function mudarTurma(uid: string, academia: string) {
  await updateDoc(doc(getDb(), "users", uid), { academia });
}

export async function salvarInterno(uid: string, apelidoInterno: string) {
  await setDoc(doc(getDb(), "usersInterno", uid), { apelidoInterno: apelidoInterno.trim() });
}

export async function lerAluno(uid: string): Promise<Aluno | null> {
  const s = await getDoc(doc(getDb(), "users", uid));
  return s.exists() ? { uid, ...(s.data() as Omit<Aluno, "uid">) } : null;
}

/* ---------- Dados do próprio aluno: medidas, anotações, resultados ---------- */
export type Medida = { id: string; data: string; peso?: number | null; altura?: number | null };
export type Nota = { id: string; data: string; texto: string };
export type Resp = { pergunta: string; marcada: string; correta: string; acertou: boolean };
export type Resultado = { id: string; data: string; titulo: string; acertos: number; total: number; respostas?: Resp[]; simuladoId?: string; ts?: number };
export type ResultadoEquipe = { id: string; uid: string; nome: string; apelido: string; academia: string; simuladoId: string; titulo: string; acertos: number; total: number; data: string; ts: number };

async function lerSub<T>(uid: string, nome: string): Promise<(T & { id: string })[]> {
  const snap = await getDocs(collection(getDb(), "users", uid, nome));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}
const porData = <T extends { data: string }>(a: T, b: T) => a.data.localeCompare(b.data);

export const lerMedidas = async (uid: string) => (await lerSub<Omit<Medida, "id">>(uid, "medidas")).sort(porData);
export const lerNotas = async (uid: string) => (await lerSub<Omit<Nota, "id">>(uid, "notas")).sort(porData).reverse();
export const lerResultados = async (uid: string) => (await lerSub<Omit<Resultado, "id">>(uid, "simulados")).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0) || porData(a, b)).reverse();

export async function addMedida(uid: string, m: { data: string; peso: number | null; altura: number | null }) {
  await addDoc(collection(getDb(), "users", uid, "medidas"), { ...m, criadoEm: serverTimestamp() });
}
export async function addNota(uid: string, n: { data: string; texto: string }) {
  await addDoc(collection(getDb(), "users", uid, "notas"), { ...n, criadoEm: serverTimestamp() });
}
export async function addResultado(uid: string, r: Omit<Resultado, "id">) {
  await addDoc(collection(getDb(), "users", uid, "simulados"), { ...r, criadoEm: serverTimestamp() });
}

/** Cópia resumida do resultado para a equipe acompanhar (sem as respostas). */
export async function publicarResultado(r: Omit<ResultadoEquipe, "id">) {
  await addDoc(collection(getDb(), "resultados"), r);
}
export async function lerResultadosEquipe(escopo: Escopo): Promise<ResultadoEquipe[]> {
  const col = collection(getDb(), "resultados");
  if (escopo === null) {
    const snap = await getDocs(query(col, orderBy("ts", "desc"), limit(100)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResultadoEquipe, "id">) }));
  }
  // Professor: uma consulta por turma dele (assim o Firestore consegue conferir a permissão).
  const snaps = await Promise.all(escopo.map((t) => getDocs(query(col, where("academia", "==", t)))));
  const todos = snaps.flatMap((s) => s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResultadoEquipe, "id">) })));
  return todos.sort((a, b) => b.ts - a.ts).slice(0, 100);
}
export async function apagarSub(uid: string, nome: "medidas" | "notas", id: string) {
  await deleteDoc(doc(getDb(), "users", uid, nome, id));
}
export async function confirmarSenhaTrocada(uid: string) {
  await updateDoc(doc(getDb(), "users", uid), { precisaTrocarSenha: false });
}
