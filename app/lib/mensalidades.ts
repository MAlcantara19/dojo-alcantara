import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getDb } from "./firebase";

/* Mensalidade por aluno e por mês (id: uid_AAAA-MM). Só o administrador marca; o aluno vê a dele. */
export type Mensalidade = { id: string; uid: string; mes: string; pago: boolean; valor: number; pagoEm: string; obs: string; turma: string };

export const mesAtual = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const nomeMes = (mes: string) => new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export async function lerMensalidadesDoMes(mes: string): Promise<Mensalidade[]> {
  const snap = await getDocs(query(collection(getDb(), "mensalidades"), where("mes", "==", mes)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Mensalidade, "id">) }));
}
export async function minhasMensalidades(uid: string): Promise<Mensalidade[]> {
  const snap = await getDocs(query(collection(getDb(), "mensalidades"), where("uid", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Mensalidade, "id">) })).sort((a, b) => b.mes.localeCompare(a.mes));
}
export async function marcarMensalidade(m: Omit<Mensalidade, "id">) {
  await setDoc(doc(getDb(), "mensalidades", `${m.uid}_${m.mes}`), m);
}
