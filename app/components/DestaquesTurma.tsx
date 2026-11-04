"use client";

import { chamadasDaTurma, type Chamada } from "../lib/chamadas";
import { lerDestaques, type Destaque } from "../lib/destaques";
import { mesAtual, nomeMes } from "../lib/mensalidades";
import { useCarga } from "../lib/useCarga";
import PainelDestaques from "./PainelDestaques";

const VAZIO_C: Chamada[] = [];
const VAZIO_D: Destaque[] = [];

/** Na área do aluno: os destaques do mês da turma dele. */
export default function DestaquesTurma({ turma }: { turma: string }) {
  const mes = mesAtual();
  const ch = useCarga(() => chamadasDaTurma(turma), VAZIO_C, Boolean(turma));
  const d = useCarga(() => lerDestaques(mes), VAZIO_D, Boolean(turma));
  if (!turma || ch.carregando || d.carregando) return null;
  return (
    <details className="fotos-turma" open>
      <summary>🏅 Destaques de {nomeMes(mes)}</summary>
      <PainelDestaques chamadas={ch.dados} destaques={d.dados.filter((x) => !x.turma || x.turma === turma)} mes={mes} />
    </details>
  );
}
