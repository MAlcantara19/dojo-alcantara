import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
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
  dan?: number;
  faixaDesde: string;
  academia: string;
  email: string;
  celular: string;
  papel: Papel;
  turmas: string[];
};

export async function criarConta(d: NovaConta, senha: string): Promise<{ login: string; uid: string }> {
  const login = paraEmail(d.email || d.celular);
  if (!login) throw new Error("sem-contato");
  const uid = await criarContaSecundaria(login, senha);
  const db = getDb();
  await setDoc(doc(db, "users", uid), {
    nome: d.nome,
    apelido: d.apelido,
    dataNascimento: d.dataNascimento || "",
    faixa: d.faixa,
    faixaDesde: d.faixaDesde || hojeISO(),
    dan: d.faixa === "Preta" ? (d.dan ?? 0) : 0,
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
  return { login, uid };
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
export async function listarAdmins(): Promise<Aluno[]> {
  const snap = await getDocs(query(collection(getDb(), "users"), where("papel", "==", "admin")));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Aluno, "uid">) })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export async function atualizarNomeConta(uid: string, nome: string) {
  await updateDoc(doc(getDb(), "users", uid), { nome });
}
export async function salvarTurmasProfessor(uid: string, turmas: string[]) {
  await updateDoc(doc(getDb(), "users", uid), { turmas });
}

/* ---------- Turmas ---------- */
export type Turma = { id: string; nome: string; apelido: string; descricao: string; localNome: string; endereco: string; horarios: string; grupoWhatsApp: string };
export type DadosTurma = Omit<Turma, "id">;

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function lerTurmas(): Promise<Turma[]> {
  const snap = await getDocs(collection(getDb(), "turmas"));
  return snap.docs
    .map((d) => {
      const r = d.data() as Record<string, unknown>;
      return { id: d.id, nome: str(r.nome), apelido: str(r.apelido), descricao: str(r.descricao), localNome: str(r.localNome), endereco: str(r.endereco), horarios: str(r.horarios), grupoWhatsApp: str(r.grupoWhatsApp) };
    })
    .filter((t) => t.nome)
    .sort((a, b) => (a.apelido || a.nome).localeCompare(b.apelido || b.nome, "pt-BR"));
}
export async function lerMinhaTurma(nome: string): Promise<Turma | null> {
  const snap = await getDocs(query(collection(getDb(), "turmas"), where("nome", "==", nome)));
  const d = snap.docs[0];
  if (!d) return null;
  const r = d.data() as Record<string, unknown>;
  return { id: d.id, nome: str(r.nome), apelido: str(r.apelido), descricao: str(r.descricao), localNome: str(r.localNome), endereco: str(r.endereco), horarios: str(r.horarios), grupoWhatsApp: str(r.grupoWhatsApp) };
}

export async function addTurma(nome: string) {
  await addDoc(collection(getDb(), "turmas"), { nome, criadoEm: serverTimestamp() });
}
export const apagarTurma = (id: string) => deleteDoc(doc(getDb(), "turmas", id));
export async function salvarTurma(id: string, d: DadosTurma) {
  await updateDoc(doc(getDb(), "turmas", id), { ...d });
}

/** Troca o nome da turma também nos alunos, nos professores e nos resultados antigos. */
export async function renomearTurma(id: string, antigo: string, novo: string) {
  const db = getDb();
  const alunos = await getDocs(query(collection(db, "users"), where("academia", "==", antigo)));
  const profs = await getDocs(query(collection(db, "users"), where("turmas", "array-contains", antigo)));
  const res = await getDocs(query(collection(db, "resultados"), where("academia", "==", antigo)));
  const av = await getDocs(query(collection(db, "avisosTurma"), where("turma", "==", antigo)));
  const escritas: (() => Promise<void>)[] = [];
  alunos.docs.forEach((d) => escritas.push(() => updateDoc(d.ref, { academia: novo })));
  profs.docs.forEach((d) => {
    const lista = ((d.data() as { turmas?: string[] }).turmas ?? []).map((t) => (t === antigo ? novo : t));
    escritas.push(() => updateDoc(d.ref, { turmas: lista }));
  });
  res.docs.forEach((d) => escritas.push(() => updateDoc(d.ref, { academia: novo })));
  av.docs.forEach((d) => escritas.push(() => updateDoc(d.ref, { turma: novo })));
  for (const e of escritas) await e();
  await updateDoc(doc(db, "turmas", id), { nome: novo });
}

/* ---------- Avisos de cada turma ---------- */
export type AvisoTurma = { id: string; turma: string; titulo: string; texto: string; data: string; autor?: string; imagem?: string; video?: string; ts?: number };

/** null = admin (todos); lista = só as turmas dadas (professor ou aluno). */
export async function lerAvisosTurma(turmas: string[] | null): Promise<AvisoTurma[]> {
  const col = collection(getDb(), "avisosTurma");
  const snaps = turmas === null ? [await getDocs(col)] : await Promise.all(turmas.filter(Boolean).map((t) => getDocs(query(col, where("turma", "==", t)))));
  const todos = snaps.flatMap((s) => s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AvisoTurma, "id">) })));
  return todos.sort((a, b) => b.data.localeCompare(a.data));
}
export async function addAvisoTurma(a: Omit<AvisoTurma, "id">) {
  await addDoc(collection(getDb(), "avisosTurma"), { ...a, ts: Date.now(), criadoEm: serverTimestamp() });
}
export const apagarAvisoTurma = (id: string) => deleteDoc(doc(getDb(), "avisosTurma", id));


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

export type DadosAluno = { nome: string; apelido: string; dataNascimento: string; faixa: string; faixaDesde: string; academia: string; email: string; celular: string; liberadoAte: string; dan: number };
export async function atualizarAluno(uid: string, d: DadosAluno) {
  await updateDoc(doc(getDb(), "users", uid), { ...d });
}

/** Coloca vários alunos de uma vez numa turma (use "" para deixá-los sem turma). */
export async function mudarTurmaLote(uids: string[], turma: string) {
  const db = getDb();
  for (let i = 0; i < uids.length; i += 400) {
    const lote = writeBatch(db);
    uids.slice(i, i + 400).forEach((uid) => lote.update(doc(db, "users", uid), { academia: turma }));
    await lote.commit();
  }
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
export type ResultadoEquipe = { id: string; uid: string; nome: string; apelido: string; academia: string; simuladoId: string; titulo: string; acertos: number; total: number; data: string; ts: number; respostas?: Resp[] };

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
export type MeuCadastro = { apelido: string; email: string; celular: string; dataNascimento: string };
export async function atualizarMeuCadastro(uid: string, d: MeuCadastro) {
  await updateDoc(doc(getDb(), "users", uid), { ...d });
}
/** Equipe (ou o próprio aluno) registra uma medida. */
export async function confirmarSenhaTrocada(uid: string) {
  await updateDoc(doc(getDb(), "users", uid), { precisaTrocarSenha: false });
}

/* ---------- Pedidos de nova senha (feitos na tela de entrada) ---------- */
export type PedidoSenha = { id: string; identificador: string; ts: number };
export async function lerPedidosSenha(): Promise<PedidoSenha[]> {
  const snap = await getDocs(collection(getDb(), "pedidosSenha"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PedidoSenha, "id">) })).sort((a, b) => b.ts - a.ts);
}
export const apagarPedidoSenha = (id: string) => deleteDoc(doc(getDb(), "pedidosSenha", id));
export async function acharPorLogin(login: string): Promise<Aluno | null> {
  const snap = await getDocs(query(collection(getDb(), "users"), where("login", "==", login)));
  const d = snap.docs[0];
  return d ? { uid: d.id, ...(d.data() as Omit<Aluno, "uid">) } : null;
}
