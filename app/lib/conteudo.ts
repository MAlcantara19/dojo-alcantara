"use client";

import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { getDb } from "./firebase";
import { avisos as avisosPadrao, eventos as eventosPadrao, type Aviso, type Evento } from "./data";

export type AvisoDoc = Aviso & { id: string };
export type EventoDoc = Evento & { id: string };

async function ler<T>(nome: string, campo: string, dir: "asc" | "desc"): Promise<(T & { id: string })[]> {
  const snap = await getDocs(query(collection(getDb(), nome), orderBy(campo, dir)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

export const lerAvisos = () => ler<Aviso>("avisos", "data", "desc");
export const lerEventos = () => ler<Evento>("eventos", "data", "asc");

export async function criarAviso(a: Aviso) {
  await addDoc(collection(getDb(), "avisos"), { ...a, criadoEm: serverTimestamp() });
}
export async function criarEvento(e: Evento) {
  await addDoc(collection(getDb(), "eventos"), { ...e, criadoEm: serverTimestamp() });
}
export async function apagar(nome: "avisos" | "eventos", id: string) {
  await deleteDoc(doc(getDb(), nome, id));
}

type Carga<T> = { itens: T[]; carregando: boolean; erro: boolean; recarregar: () => void };

function useColecao<T>(carregar: () => Promise<T[]>, padrao: T[]): Carga<T> {
  const [itens, setItens] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregar()
      .then((r) => {
        if (!ativo) return;
        setItens(r);
        setErro(false);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setItens(padrao); // sem conexão ou sem permissão: mostra o conteúdo de exemplo
        setErro(true);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const recarregar = useCallback(() => setTick((t) => t + 1), []);
  return { itens, carregando, erro, recarregar };
}

export const useAvisos = () => useColecao<AvisoDoc>(lerAvisos, avisosPadrao.map((a, i) => ({ ...a, id: "p" + i })));
export const useEventos = () => useColecao<EventoDoc>(lerEventos, eventosPadrao.map((e, i) => ({ ...e, id: "p" + i })));

/* ---------- Técnicas: faixa, PDF e vídeo editados pelo painel ---------- */
export type ConfigTecnica = { faixa?: string; pdf?: string; video?: string; nota?: string };
export type MapaConfig = Record<string, ConfigTecnica>;

export async function lerConfigTecnicas(): Promise<MapaConfig> {
  const snap = await getDocs(collection(getDb(), "tecnicas"));
  const mapa: MapaConfig = {};
  snap.docs.forEach((d) => {
    mapa[d.id] = d.data() as ConfigTecnica;
  });
  return mapa;
}

export async function salvarConfigTecnica(id: string, c: Required<ConfigTecnica>) {
  await setDoc(doc(getDb(), "tecnicas", id), c);
}

export function useConfigTecnicas() {
  const [mapa, setMapa] = useState<MapaConfig>({});
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let ativo = true;
    lerConfigTecnicas()
      .then((m) => ativo && setMapa(m))
      .catch(() => ativo && setMapa({}));
    return () => {
      ativo = false;
    };
  }, [tick]);
  return { mapa, recarregar: () => setTick((t) => t + 1) };
}
