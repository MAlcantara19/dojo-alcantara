"use client";

import { useMemo } from "react";
import { ehEquipe } from "./auth";
import { faixas } from "./faixas";
import { useSite } from "./siteConfig";
import { useAuth } from "./useAuth";

export type Acesso = { todas: boolean; liberadas: Set<string>; logado: boolean; carregando: boolean };

/**
 * Quais faixas de técnicas cada pessoa vê:
 * - público: só as faixas abertas no painel (padrão: azul);
 * - aluno: até a próxima faixa dele, ou até a faixa que o administrador liberar;
 * - professor e administrador: todas.
 */
export function useAcessoTecnicas(contexto: "tecnicas" | "roleta" = "tecnicas"): Acesso {
  const { user, perfil, carregando } = useAuth();
  const site = useSite();
  const publicas = (contexto === "roleta" ? site.faixasPublicasRoleta : site.faixasPublicas).join("|");
  return useMemo(() => {
    const nomes = faixas.map((f) => f.nome);
    const liberadas = new Set(publicas ? publicas.split("|") : []);
    if (perfil && ehEquipe(perfil)) return { todas: true, liberadas: new Set(nomes), logado: true, carregando };
    if (perfil?.papel === "aluno") {
      const ate = Math.max(nomes.indexOf(perfil.faixa ?? "") + 1, nomes.indexOf(perfil.liberadoAte ?? ""));
      nomes.slice(0, ate + 1).forEach((n) => liberadas.add(n));
    }
    return { todas: false, liberadas, logado: Boolean(user), carregando };
  }, [perfil, publicas, user, carregando]);
}

/** Técnica sem faixa definida só aparece para quem está logado. */
export const podeVer = (a: Acesso, faixa?: string) => a.todas || (faixa ? a.liberadas.has(faixa) : a.logado);
