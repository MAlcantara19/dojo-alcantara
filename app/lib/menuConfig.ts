"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { useMemo } from "react";
import { getDb } from "./firebase";
import { useCarga } from "./useCarga";

/* Menu lateral configurável pelo administrador (Painel > Site > Menu lateral). */
export type Estado = "visivel" | "embreve" | "oculto";
export type ItemMenuCfg = { id: string; rotulo: string; href: string; estado: Estado; custom?: boolean };
export type SecaoMenu = { id: string; titulo: string; tipo: "lista" | "pai"; href: string; estado: "visivel" | "oculto"; itens: ItemMenuCfg[]; custom?: boolean };

const item = (id: string, rotulo: string, href: string): ItemMenuCfg => ({ id, rotulo, href, estado: "visivel" });

export const MENU_PADRAO: SecaoMenu[] = [
  {
    id: "dojo",
    titulo: "Dojô",
    tipo: "lista",
    href: "",
    estado: "visivel",
    itens: [item("inicio", "Início", "/"), item("avisos", "Avisos", "/#avisos"), item("calendario", "Calendário", "/calendario"), item("galeria", "Galeria", "/galeria"), item("parcerias", "Parcerias e descontos", "/parcerias"), item("experimental", "Aula experimental", "/aula-experimental"), item("sugestoes", "Sugestões", "/sugestoes"), item("sobre", "Sobre nós", "/#sobre")],
  },
  {
    id: "estudo",
    titulo: "Estudo do Judô",
    tipo: "pai",
    href: "/estudo",
    estado: "visivel",
    itens: [item("tecnicas", "Técnicas", "/tecnicas"), item("simulados", "Simulados", "/simulados"), item("roleta", "Roleta", "/roleta"), item("katas", "Katas", "/katas"), item("materiais", "Materiais e PDFs", "/materiais")],
  },
];

const ESTADOS: Estado[] = ["visivel", "embreve", "oculto"];

/** Junta o que foi salvo com o padrão: itens novos do código aparecem sozinhos no fim. */
export function mesclarMenu(salvo?: SecaoMenu[] | null): SecaoMenu[] {
  if (!Array.isArray(salvo) || salvo.length === 0) return MENU_PADRAO;
  const saida: SecaoMenu[] = [];
  salvo.forEach((s) => {
    const base = MENU_PADRAO.find((b) => b.id === s.id);
    if (!base && !s.custom) return;
    const itensSalvos = (s.itens ?? [])
      .map((i) => {
        const bi = base?.itens.find((x) => x.id === i.id);
        if (!bi && !i.custom) return null;
        return { id: i.id, rotulo: i.rotulo || bi?.rotulo || "", href: bi ? bi.href : i.href, estado: ESTADOS.includes(i.estado) ? i.estado : "visivel", custom: !bi } as ItemMenuCfg;
      })
      .filter((x): x is ItemMenuCfg => Boolean(x && x.rotulo));
    const faltando = (base?.itens ?? []).filter((b) => !itensSalvos.some((i) => i.id === b.id));
    saida.push({ id: s.id, titulo: s.titulo || base?.titulo || "Seção", tipo: base?.tipo ?? "lista", href: base?.href ?? "", estado: s.estado === "oculto" ? "oculto" : "visivel", itens: [...itensSalvos, ...faltando], custom: !base });
  });
  MENU_PADRAO.filter((b) => !saida.some((s) => s.id === b.id)).forEach((b) => saida.push(b));
  return saida;
}

export async function lerMenu(): Promise<SecaoMenu[] | null> {
  const d = await getDoc(doc(getDb(), "config", "menu"));
  return d.exists() ? ((d.data() as { secoes?: SecaoMenu[] }).secoes ?? null) : null;
}
export async function salvarMenu(secoes: SecaoMenu[]) {
  await setDoc(doc(getDb(), "config", "menu"), { secoes: JSON.parse(JSON.stringify(secoes)) as SecaoMenu[] });
}

export function useMenu() {
  const c = useCarga(lerMenu, null);
  const menu = useMemo(() => mesclarMenu(c.dados), [c.dados]);
  return { menu, recarregar: c.recarregar, carregando: c.carregando };
}

/** Estado de uma página pelo endereço (para a página mostrar “em breve” ou sumir). */
export function estadoDe(menu: SecaoMenu[], href: string): Estado {
  for (const s of menu) {
    const i = s.itens.find((x) => x.href === href);
    if (i) return s.estado === "oculto" ? "oculto" : i.estado;
  }
  return "visivel";
}
