import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { katas as katasPadrao } from "./katas";

export type Video = { titulo: string; url: string };
export type Imagem = { legenda: string; url: string };
export type KataDoc = { id: string; nome: string; dan: string; resumo: string; custom: boolean; videos: Video[]; imagens: Imagem[] };

export const idDoKata = (nome: string) => nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Só aceita endereços https://, arquivos do próprio site (/img/...) ou fotos enviadas pelo painel (db:...). */
export const enderecoOk = (u: string) => /^https:\/\/\S+$/.test(u) || /^\/[A-Za-z0-9_./-]+$/.test(u) || /^db:[A-Za-z0-9]{8,40}$/.test(u);

export async function lerKatasDb(): Promise<Record<string, Partial<KataDoc>>> {
  const snap = await getDocs(collection(getDb(), "katas"));
  const m: Record<string, Partial<KataDoc>> = {};
  snap.docs.forEach((d) => {
    m[d.id] = d.data() as Partial<KataDoc>;
  });
  return m;
}

/** Junta os katas padrão com o que foi editado e os cards criados pelo professor. */
export function montarKatas(db: Record<string, Partial<KataDoc>>): KataDoc[] {
  const padrao = katasPadrao.map((k) => {
    const id = idDoKata(k.nome);
    const d = db[id] ?? {};
    return { id, nome: k.nome, dan: k.dan, resumo: k.resumo, custom: false, videos: d.videos ?? [], imagens: d.imagens ?? [] };
  });
  const extras = Object.entries(db)
    .filter(([, d]) => d.custom)
    .map(([id, d]) => ({ id, nome: d.nome ?? id, dan: d.dan ?? "", resumo: d.resumo ?? "", custom: true, videos: d.videos ?? [], imagens: d.imagens ?? [] }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return [...padrao, ...extras];
}

export async function salvarMidiaKata(id: string, videos: Video[], imagens: Imagem[]) {
  await setDoc(doc(getDb(), "katas", id), { videos, imagens }, { merge: true });
}
export async function criarCardKata(nome: string, dan: string, resumo: string) {
  await addDoc(collection(getDb(), "katas"), { nome, dan, resumo, custom: true, videos: [], imagens: [], criadoEm: serverTimestamp() });
}
export const apagarCardKata = (id: string) => deleteDoc(doc(getDb(), "katas", id));
