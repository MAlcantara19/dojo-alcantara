import { addDoc, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getDb } from "./firebase";

export const STATUS_EXP = ["Novo", "Contatado", "Agendado", "Fez a aula", "Virou aluno", "Desistiu"] as const;
export type Experimental = { id: string; nome: string; idade: string; telefone: string; turma: string; horario: string; mensagem: string; status: string; obs: string; ts: number; menor?: boolean; responsavel?: string; telResponsavel?: string };

/** Envia pelo servidor (que avisa a equipe no celular); sem servidor, grava direto no banco. */
export async function pedirAulaExperimental(d: Omit<Experimental, "id" | "status" | "obs" | "ts"> & { consente: boolean; site: string }): Promise<string> {
  const r = await fetch("/api/experimental", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).catch(() => null);
  if (r && r.ok) return "ok";
  if (r && r.status === 400) return ((await r.json().catch(() => ({}))) as { mensagem?: string }).mensagem ?? "Confira os dados.";
  const { consente, site, ...resto } = d;
  void consente;
  void site;
  await addDoc(collection(getDb(), "experimentais"), { ...resto, menor: Boolean(resto.menor), responsavel: resto.responsavel ?? "", telResponsavel: (resto.telResponsavel ?? "").replace(/\D/g, ""), telefone: resto.telefone.replace(/\D/g, ""), status: "Novo", obs: "", ts: Date.now() });
  return "ok";
}
export async function lerExperimentais(): Promise<Experimental[]> {
  const snap = await getDocs(collection(getDb(), "experimentais"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Experimental, "id">) })).sort((a, b) => b.ts - a.ts);
}
export const atualizarExperimental = (id: string, status: string, obs: string) => updateDoc(doc(getDb(), "experimentais", id), { status, obs });
