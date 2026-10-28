import { addDoc, collection, getDocs, query, updateDoc, doc, where } from "firebase/firestore";
import { getDb } from "./firebase";

export const TIPOS_SUGESTAO = ["Sugestão", "Crítica construtiva", "Elogio", "Problema no site"] as const;
export const STATUS_SUGESTAO = ["Nova", "Lida", "Em andamento", "Feito"] as const;
export type Sugestao = { id: string; uid: string; nome: string; tipo: string; texto: string; imagem: string; video: string; status: string; resposta: string; ts: number };

export async function enviarSugestao(s: Omit<Sugestao, "id" | "status" | "resposta" | "ts">) {
  await addDoc(collection(getDb(), "sugestoes"), { ...s, status: "Nova", resposta: "", ts: Date.now() });
}
/** O aluno vê as dele; o administrador vê todas. */
export async function lerSugestoes(uid: string | null): Promise<Sugestao[]> {
  const col = collection(getDb(), "sugestoes");
  const snap = await getDocs(uid ? query(col, where("uid", "==", uid)) : col);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sugestao, "id">) })).sort((a, b) => b.ts - a.ts);
}
export const responderSugestao = (id: string, status: string, resposta: string) => updateDoc(doc(getDb(), "sugestoes", id), { status, resposta });
