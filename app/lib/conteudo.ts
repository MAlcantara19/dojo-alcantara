"use client";

import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFichas } from "./fichas";
import { montarCatalogo } from "./tecnicas";
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
export async function atualizarAviso(id: string, a: Aviso) {
  await updateDoc(doc(getDb(), "avisos", id), { ...a });
}
export async function atualizarEvento(id: string, e: Evento) {
  await updateDoc(doc(getDb(), "eventos", id), { ...e });
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
export type ConfigTecnica = { faixa?: string; pdf?: string; video?: string; nota?: string; imagem?: string; links?: { titulo: string; url: string }[]; nome?: string; ocultar?: boolean; custom?: boolean; categoria?: string; familia?: string; grupo?: string };
export type MapaConfig = Record<string, ConfigTecnica>;

export async function lerConfigTecnicas(): Promise<MapaConfig> {
  const snap = await getDocs(collection(getDb(), "tecnicas"));
  const mapa: MapaConfig = {};
  snap.docs.forEach((d) => {
    mapa[d.id] = d.data() as ConfigTecnica;
  });
  return mapa;
}

export async function salvarConfigTecnica(id: string, c: ConfigTecnica) {
  const limpo = Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined));
  await setDoc(doc(getDb(), "tecnicas", id), limpo);
}
export const apagarConfigTecnica = (id: string) => deleteDoc(doc(getDb(), "tecnicas", id));

export function useConfigTecnicas() {
  const [bruto, setBruto] = useState<MapaConfig>({});
  const [tick, setTick] = useState(0);
  const fichas = useFichas();
  useEffect(() => {
    let ativo = true;
    lerConfigTecnicas()
      .then((m) => ativo && setBruto(m))
      .catch(() => ativo && setBruto({}));
    return () => {
      ativo = false;
    };
  }, [tick]);

  // O que você cadastrou à mão vale mais; as fichas do Drive completam o que faltar.
  const mapa = useMemo(() => {
    const m: MapaConfig = { ...bruto };
    Object.entries(fichas.mapa).forEach(([id, f]) => {
      const c = m[id] ?? {};
      m[id] = { ...c, imagem: c.imagem || f.imagem, pdf: c.pdf || f.pdf };
    });
    return m;
  }, [bruto, fichas.mapa]);

  return { mapa, bruto, automatico: fichas.mapa, recarregar: () => setTick((t) => t + 1) };
}

/** As técnicas do site já com os ajustes do painel (nomes editados, escondidas e criadas por você). */
export function useTecnicas() {
  const c = useConfigTecnicas();
  const lista = useMemo(() => montarCatalogo(c.bruto), [c.bruto]);
  return { ...c, lista };
}
