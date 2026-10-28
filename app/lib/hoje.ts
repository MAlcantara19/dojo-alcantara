"use client";

import { useSyncExternalStore } from "react";
import { hojeISO } from "./aluno";

const nada = () => () => {};
/** Data de hoje (AAAA-MM-DD) no navegador; vazio enquanto a página é montada no servidor. */
export const useHoje = () => useSyncExternalStore(nada, hojeISO, () => "");

/** Aviso ainda vale? (sem data de fim = vale sempre) */
export const avisoValido = (a: { ate?: string }, hoje: string) => !a.ate || !hoje || a.ate >= hoje;
