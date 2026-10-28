"use client";

import type { Aluno } from "../lib/aluno";
import { listarAlunos } from "../lib/alunos";
import { todasChamadas, type Chamada } from "../lib/chamadas";
import { mesAtual, nomeMes } from "../lib/mensalidades";
import { useCarga } from "../lib/useCarga";
import Avatar from "./Avatar";

const VAZIO_C: Chamada[] = [];
const VAZIO_A: Aluno[] = [];

/** Quem mais treinou no mês (para elogiar na aula e motivar a turma). */
export default function AdminDestaques() {
  const chamadas = useCarga(todasChamadas, VAZIO_C);
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const mes = mesAtual();
  const doMes = chamadas.dados.filter((c) => c.data.startsWith(mes));
  const conta = new Map<string, number>();
  doMes.forEach((c) => c.presentes.forEach((u) => conta.set(u, (conta.get(u) ?? 0) + 1)));
  const top = Array.from(conta.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uid, n]) => ({ a: alunos.dados.find((x) => x.uid === uid), n }))
    .filter((x) => x.a);
  if (!doMes.length) return null;
  return (
    <section className="panel">
      <h2>🏅 Destaques de {nomeMes(mes)}</h2>
      <p className="lead">Quem mais veio aos treinos neste mês ({doMes.length} chamadas registradas).</p>
      <ol className="destaques">
        {top.map(({ a, n }, i) => (
          <li key={a?.uid}>
            <span className="destaque-pos">{["🥇", "🥈", "🥉", "4º", "5º"][i]}</span>
            <Avatar url={a?.foto} ajuste={a?.fotoAjuste} nome={a?.apelido || a?.nome || ""} faixa={a?.faixa} dan={a?.dan} tamanho={36} />
            <span>
              <strong>{a?.apelido || a?.nome}</strong>
              <small>
                {n} {n === 1 ? "treino" : "treinos"} · {a?.academia || "sem turma"}
              </small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
