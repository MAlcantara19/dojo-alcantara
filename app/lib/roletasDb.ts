import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

/* Roletas criadas pelo professor (ex.: comandos de arbitragem, katas, golpes da turma). */
export type ItemRoleta = { texto: string; resposta: string };
export type RoletaDoc = { id: string; titulo: string; itens: ItemRoleta[] };

export async function lerRoletas(): Promise<RoletaDoc[]> {
  const snap = await getDocs(collection(getDb(), "roletas"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RoletaDoc, "id">) })).sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}
export async function addRoleta(titulo: string, itens: ItemRoleta[]) {
  await addDoc(collection(getDb(), "roletas"), { titulo, itens, criadoEm: serverTimestamp() });
}
export const salvarRoleta = (id: string, titulo: string, itens: ItemRoleta[]) => updateDoc(doc(getDb(), "roletas", id), { titulo, itens });
export const apagarRoleta = (id: string) => deleteDoc(doc(getDb(), "roletas", id));

/** Texto do painel ("Item | resposta", um por linha) → itens. */
export const lerItensDoTexto = (t: string): ItemRoleta[] =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 100)
    .map((l) => {
      const i = l.indexOf("|");
      return i >= 0 ? { texto: l.slice(0, i).trim().slice(0, 60), resposta: l.slice(i + 1).trim().slice(0, 200) } : { texto: l.slice(0, 60), resposta: "" };
    })
    .filter((x) => x.texto);
export const itensParaTexto = (itens: ItemRoleta[]) => itens.map((x) => (x.resposta ? `${x.texto} | ${x.resposta}` : x.texto)).join("\n");

/** Embaralha sempre do mesmo jeito para a mesma semente (para “sortear outras”). */
export function amostra<T>(lista: T[], n: number, semente: number): T[] {
  if (!n || lista.length <= n) return lista;
  let s = semente || 1;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, n);
}
