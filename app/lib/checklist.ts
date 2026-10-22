import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";

/* Autoavaliação por faixa: para cada técnica, [sei o nome, executo, sei o erro]. */
export type Marcas = Record<string, [boolean, boolean, boolean]>;

export async function lerChecklist(uid: string, faixa: string): Promise<Marcas> {
  const d = await getDoc(doc(getDb(), "users", uid, "checklist", faixa));
  return d.exists() ? (((d.data() as { itens?: Marcas }).itens ?? {}) as Marcas) : {};
}
export async function salvarChecklist(uid: string, faixa: string, itens: Marcas) {
  await setDoc(doc(getDb(), "users", uid, "checklist", faixa), { itens, ts: Date.now() });
}
