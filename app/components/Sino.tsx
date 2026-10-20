"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { lerAvisosTurma, type AvisoTurma } from "../lib/alunos";
import { lerAtividades, type Atividade } from "../lib/atividades";
import { useAvisos } from "../lib/conteudo";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";

const CHAVE = "dojoAvisosVisto";
const ouvintes = new Set<() => void>();
const assinar = (cb: () => void) => {
  ouvintes.add(cb);
  return () => void ouvintes.delete(cb);
};
const lerBruto = () => {
  try {
    return localStorage.getItem(CHAVE) ?? "";
  } catch {
    return "x";
  }
};
const marcar = () => {
  try {
    localStorage.setItem(CHAVE, String(Date.now()));
  } catch {}
  ouvintes.forEach((f) => f());
};
const VAZIO: AvisoTurma[] = [];
const VAZIO_AT: Atividade[] = [];
const quando = (a: { ts?: number; data: string }) => a.ts ?? (Date.parse(a.data + "T12:00:00") || 0);

/** Sininho: mostra quantos avisos novos (do site e da turma) saíram desde a última vez que você olhou. */
export default function Sino() {
  const { user, perfil } = useAuth();
  const av = useAvisos();
  const turma = perfil?.academia ?? "";
  const daTurma = useCarga(() => lerAvisosTurma([turma]), VAZIO, Boolean(user && turma && perfil?.papel === "aluno"));
  const atividades = useCarga(lerAtividades, VAZIO_AT, perfil?.papel === "admin");
  const bruto = useSyncExternalStore(assinar, lerBruto, () => "x");
  const [aberto, setAberto] = useState(false);

  // Primeira visita neste aparelho: o que já existe não conta como novo.
  useEffect(() => {
    if (bruto === "") marcar();
  }, [bruto]);

  const visto = Number(bruto) || Number.MAX_SAFE_INTEGER;
  const itens = [
    ...(av.erro ? [] : av.itens.map((a) => ({ id: "s" + a.id, titulo: a.titulo, origem: "Aviso do site", ts: quando(a), href: "/#avisos" }))),
    ...daTurma.dados.map((a) => ({ id: "t" + a.id, titulo: a.titulo, origem: "Aviso da sua turma", ts: quando(a), href: "/perfil" })),
    ...atividades.dados.map((a) => ({ id: "a" + a.id, titulo: `${a.nome} ${a.texto}`, origem: "Atividade de aluno", ts: a.ts, href: "/admin" })),
  ].sort((x, y) => y.ts - x.ts);
  const novos = itens.filter((i) => i.ts > visto);

  return (
    <div className="sino">
      <button
        type="button"
        className="icon-btn"
        aria-label={novos.length ? `${novos.length} avisos novos` : "Avisos"}
        aria-expanded={aberto}
        onClick={() => {
          setAberto((v) => !v);
          if (aberto) marcar();
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        {novos.length > 0 && <span className="sino-conta">{novos.length > 9 ? "9+" : novos.length}</span>}
      </button>
      {aberto && (
        <div className="sino-lista" role="dialog" aria-label="Avisos novos">
          <strong>{novos.length ? "Avisos novos" : "Nada novo por enquanto"}</strong>
          <ul>
            {(novos.length ? novos : itens.slice(0, 3)).slice(0, 5).map((i) => (
              <li key={i.id}>
                <Link href={i.href} onClick={() => (setAberto(false), marcar())}>
                  <b>{i.titulo}</b>
                  <small>{i.origem}</small>
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className="link-btn" onClick={() => (setAberto(false), marcar())}>
            Marcar como vistos e fechar
          </button>
        </div>
      )}
    </div>
  );
}
