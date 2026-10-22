"use client";

import type { EventoDoc } from "./conteudo";
import { useCarga } from "./useCarga";

const VAZIO: EventoDoc[] = [];

async function lerAgenda(): Promise<EventoDoc[]> {
  const r = await fetch("/api/agenda");
  if (!r.ok) return [];
  const j = (await r.json()) as { eventos?: { id: string; titulo: string; data: string; hora: string; local: string; descricao: string }[] };
  return (j.eventos ?? []).map((e) => ({ id: e.id, titulo: e.titulo, data: e.data, hora: e.hora || "A confirmar", local: e.local || "A definir", tipo: "Agenda", descricao: e.descricao }));
}

/** Eventos da agenda do Google ligada no painel (Mural e calendário → Agenda do Google). */
export function useAgendaGoogle() {
  return useCarga(lerAgenda, VAZIO).dados;
}
