import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";

/* Aniversários para o calendário: só dia e mês e o apelido (ou primeiro nome). Só quem está logado vê. */
export type Aniversario = { id: string; nome: string; mmdd: string };

const primeiro = (nome: string, apelido?: string) => (apelido || nome.split(" ")[0] || "").slice(0, 40);

export async function guardarAniversario(uid: string, nome: string, apelido: string | undefined, nascimento: string | undefined) {
  const ref = doc(getDb(), "aniversarios", uid);
  if (!nascimento || nascimento.length !== 10) return deleteDoc(ref).catch(() => undefined);
  await setDoc(ref, { nome: primeiro(nome, apelido), mmdd: nascimento.slice(5) });
}

export async function lerAniversarios(): Promise<Aniversario[]> {
  const snap = await getDocs(collection(getDb(), "aniversarios"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Aniversario, "id">) }));
}
