"use client";

import { useSyncExternalStore } from "react";

/*
 * Modo leve (economizar dados): sem animações, sem tela de abertura e sem efeitos pesados.
 * “auto” liga sozinho quando o celular pede economia de dados ou a internet é lenta (2G/3G).
 */
export type PrefLeve = "auto" | "on" | "off";
const CHAVE = "dojoModoLeve";
const ouvintes = new Set<() => void>();

type Conexao = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, f: () => void) => void };
const conexao = (): Conexao | undefined => (typeof navigator !== "undefined" ? (navigator as Navigator & { connection?: Conexao }).connection : undefined);

export function lerPrefLeve(): PrefLeve {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "on" || v === "off" ? v : "auto";
  } catch {
    return "auto";
  }
}
export function internetLenta(): boolean {
  const c = conexao();
  return Boolean(c?.saveData) || ["slow-2g", "2g", "3g"].includes(c?.effectiveType ?? "");
}
export function modoLeveAtivo(): boolean {
  const p = lerPrefLeve();
  return p === "on" || (p === "auto" && internetLenta());
}
export function definirPrefLeve(p: PrefLeve) {
  try {
    if (p === "auto") localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, p);
  } catch {}
  ouvintes.forEach((f) => f());
}
const assinar = (cb: () => void) => {
  ouvintes.add(cb);
  conexao()?.addEventListener?.("change", cb);
  return () => void ouvintes.delete(cb);
};
/** "on" | "off" | "auto" escolhido e se está ativo agora. */
export function useModoLeve() {
  const pref = useSyncExternalStore(assinar, lerPrefLeve, () => "auto" as PrefLeve);
  const ativo = useSyncExternalStore(assinar, modoLeveAtivo, () => false);
  return { pref, ativo };
}
