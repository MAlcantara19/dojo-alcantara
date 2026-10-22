import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

export const CATEGORIAS_PARCERIA = ["Loja", "Academia", "Escola", "Saúde", "Serviço", "Outro"];
export type Parceria = {
  id: string;
  nome: string;
  descricao: string;
  url: string;
  logo: string;
  logoAjuste?: { z: number; x: number; y: number };
  banner?: string;
  bannerAjuste?: { z: number; x: number; y: number };
  desconto: string;
  cupom?: string;
  destaque?: boolean;
  produtos?: string[]; // "Nome | https://link" (link opcional)
  categoria: string;
  ts: number;
};
export type DadosParceria = Omit<Parceria, "id" | "ts">;

export async function lerParcerias(): Promise<Parceria[]> {
  const snap = await getDocs(collection(getDb(), "parcerias"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Parceria, "id">) }))
    .sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)) || (a.ts ?? 0) - (b.ts ?? 0));
}
export async function addParceria(d: DadosParceria) {
  await addDoc(collection(getDb(), "parcerias"), { ...JSON.parse(JSON.stringify(d)), ts: Date.now(), criadoEm: serverTimestamp() });
}
export const atualizarParceria = (id: string, d: DadosParceria) => updateDoc(doc(getDb(), "parcerias", id), { ...JSON.parse(JSON.stringify(d)) });
export const apagarParceria = (id: string) => deleteDoc(doc(getDb(), "parcerias", id));
