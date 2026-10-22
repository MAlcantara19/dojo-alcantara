import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { getDb } from "./firebase";

/* Campeonatos do dojô (evento com inscritos), diferente do histórico de lutas de cada aluno. */
export type Arquivo = { titulo: string; url: string };
export type CampeonatoDojo = { id: string; nome: string; data: string; local: string; descricao: string; arquivos: Arquivo[]; turma: string; publico: boolean; autor: string; ts: number };
export type DadosCampeonatoDojo = Omit<CampeonatoDojo, "id" | "ts">;
export type Inscrito = { uid: string; nome: string; turma: string; sexo: "M" | "F"; classe: string; categoria: string; peso: string; altura: string; ts: number };

const limpar = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const col = () => collection(getDb(), "campeonatos");

/** logado = vê também os campeonatos só dos alunos. */
export async function lerCampeonatosDojo(logado: boolean): Promise<CampeonatoDojo[]> {
  const snap = await getDocs(logado ? col() : query(col(), where("publico", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CampeonatoDojo, "id">) })).sort((a, b) => b.data.localeCompare(a.data));
}
export async function addCampeonatoDojo(d: DadosCampeonatoDojo): Promise<string> {
  const r = await addDoc(col(), { ...limpar(d), ts: Date.now(), criadoEm: serverTimestamp() });
  return r.id;
}
export const salvarCampeonatoDojo = (id: string, d: DadosCampeonatoDojo) => updateDoc(doc(getDb(), "campeonatos", id), { ...limpar(d) });
export const apagarCampeonatoDojo = (id: string) => deleteDoc(doc(getDb(), "campeonatos", id));

export async function lerInscritos(id: string): Promise<Inscrito[]> {
  const snap = await getDocs(collection(getDb(), "campeonatos", id, "inscritos"));
  return snap.docs.map((d) => d.data() as Inscrito).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
export const salvarInscrito = (id: string, i: Inscrito) => setDoc(doc(getDb(), "campeonatos", id, "inscritos", i.uid), limpar({ ...i, ts: Date.now() }));
export const tirarInscrito = (id: string, uid: string) => deleteDoc(doc(getDb(), "campeonatos", id, "inscritos", uid));

/* Comprovante de pagamento ou documento: só o administrador e o professor da turma veem. */
export type Comprovante = { url: string; obs: string; turma: string };
export async function lerComprovante(id: string, uid: string): Promise<Comprovante | null> {
  try {
    const d = await getDoc(doc(getDb(), "campeonatos", id, "comprovantes", uid));
    return d.exists() ? (d.data() as Comprovante) : null;
  } catch {
    return null;
  }
}
export const salvarComprovante = (id: string, uid: string, c: Comprovante) => setDoc(doc(getDb(), "campeonatos", id, "comprovantes", uid), c);
export const tirarComprovante = (id: string, uid: string) => deleteDoc(doc(getDb(), "campeonatos", id, "comprovantes", uid)).catch(() => undefined);
