import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";

export type FotoDoc = { id: string; legenda: string; url: string; ts?: number };

export async function lerGaleria(): Promise<FotoDoc[]> {
  const snap = await getDocs(collection(getDb(), "galeria"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FotoDoc, "id">) })).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
}
export async function addFoto(legenda: string, url: string) {
  await addDoc(collection(getDb(), "galeria"), { legenda, url, ts: Date.now(), criadoEm: serverTimestamp() });
}
export const salvarLegenda = (id: string, legenda: string) => updateDoc(doc(getDb(), "galeria", id), { legenda });
export const apagarFoto = (id: string) => deleteDoc(doc(getDb(), "galeria", id));

/* ---------- Pasta do Google Drive (só o professor coloca fotos nela) ---------- */
export type FotoSite = { id: string; legenda: string; src?: string; baixar?: string; ts?: number };

type ArquivoDrive = { id: string; name: string; createdTime: string };

export async function lerPastaDrive(pasta: string, chave: string): Promise<FotoSite[]> {
  const q = `'${pasta}' in parents and mimeType contains 'image/' and trashed = false`;
  const params = new URLSearchParams({ q, orderBy: "createdTime desc", pageSize: "60", fields: "files(id,name,createdTime)", key: chave });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  if (!r.ok) throw new Error(String(r.status));
  const j = (await r.json()) as { files?: ArquivoDrive[] };
  return (j.files ?? []).map((a) => ({
    id: "drive-" + a.id,
    legenda: a.name.replace(/\.[A-Za-z0-9]+$/, "").replace(/[_-]+/g, " "),
    src: `https://drive.google.com/thumbnail?id=${a.id}&sz=w1000`,
    baixar: `https://drive.google.com/uc?export=download&id=${a.id}`,
    ts: Date.parse(a.createdTime) || 0,
  }));
}

/** Subpastas da pasta da galeria: cada uma vira um álbum (ex.: “Aula 24-10-2026”). */
export type Album = { id: string; nome: string; ts: number };
export async function lerSubpastas(pasta: string, chave: string): Promise<Album[]> {
  const q = `'${pasta}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({ q, orderBy: "createdTime desc", pageSize: "60", fields: "files(id,name,createdTime)", key: chave });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  if (!r.ok) throw new Error(String(r.status));
  const j = (await r.json()) as { files?: { id: string; name: string; createdTime: string }[] };
  return (j.files ?? []).map((a) => ({ id: a.id, nome: a.name, ts: Date.parse(a.createdTime) || 0 }));
}
