import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

/* Materiais de estudo: PDFs, apostilas, vídeos e links, organizados por categoria e faixa. */
export const TIPOS_MATERIAL = ["PDF", "Apostila", "Vídeo", "Imagem", "Link"] as const;
export const CATEGORIAS_MATERIAL = ["Apostilas", "Regras e arbitragem", "Programa de faixas", "Katas", "História do judô", "Preparação física", "Outros"];

export type Material = { id: string; titulo: string; descricao: string; url: string; tipo: string; categoria: string; faixa: string; ts: number };
export type DadosMaterial = Omit<Material, "id" | "ts">;

export async function lerMateriais(): Promise<Material[]> {
  const snap = await getDocs(collection(getDb(), "materiais"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Material, "id">) })).sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}
export async function addMaterial(d: DadosMaterial) {
  await addDoc(collection(getDb(), "materiais"), { ...d, ts: Date.now(), criadoEm: serverTimestamp() });
}
export const salvarMaterial = (id: string, d: DadosMaterial) => updateDoc(doc(getDb(), "materiais", id), { ...d });
export const apagarMaterial = (id: string) => deleteDoc(doc(getDb(), "materiais", id));
