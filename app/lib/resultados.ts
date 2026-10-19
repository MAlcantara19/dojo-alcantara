"use client";

import { useState } from "react";
import { lerResultadosEquipe, type Escopo, type ResultadoEquipe } from "./alunos";
import { useCarga } from "./useCarga";

const CHAVE = "dojoResultadosVisto";
const VAZIO: ResultadoEquipe[] = [];

function lerVisto(): number {
  try {
    return Number(localStorage.getItem(CHAVE) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Resultados de simulados dos alunos + quantos são novos desde a última vez que a equipe olhou. */
export function useResultadosEquipe(escopo: Escopo) {
  const c = useCarga(() => lerResultadosEquipe(escopo), VAZIO);
  const [visto, setVisto] = useState<number>(lerVisto);
  const novos = c.dados.filter((r) => r.ts > visto).length;

  function marcarVisto() {
    const agora = Date.now();
    try {
      localStorage.setItem(CHAVE, String(agora));
    } catch {}
    setVisto(agora);
  }

  return { ...c, novos, visto, marcarVisto };
}
